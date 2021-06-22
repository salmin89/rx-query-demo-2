import { Component, VERSION } from '@angular/core';
import { mutateError, mutateOptimistic, mutateSuccess, query } from 'rx-query';
import { Subject, throwError } from 'rxjs';
import { catchError, filter, map, shareReplay, tap, withLatestFrom } from 'rxjs/operators';
import { TagService, TagType } from '../tag.service';


const KEYS = {
  TAG_LIST: 'tag-list',
  TAG: 'tag',
};
export const defaultConfig = {
  cacheTime: 30_000, // How long an item remains in the cache (in milliseconds) when there are no subscribers
  staleTime: 5_000, // How long an item is "fresh" in milliseconds When an item is fresh, it won't get refetched
  refetchOnWindowFocus: false,
  keepPreviousData: true,
};


@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  constructor(public service: TagService) {}

  emptyTag = { name: null, color: null };
  newTagData = { ...this.emptyTag };

  currentTag$: Subject<TagType> = new Subject();
  currentTagId$ = this.currentTag$.pipe(
    filter((tag) => !!tag),
    map((tag) => tag?.id),
  );

  tags$ = query(KEYS.TAG_LIST, () => this.service.getTags(), { ...defaultConfig }).pipe(shareReplay());

  tag$ = query(KEYS.TAG, this.currentTagId$, (id) => this.service.getTag(id), {
    refetchOnWindowFocus: false,
    mutator: (tag) => {
      const updater = (tags: TagType[]) => {
        const result = tags.map<TagType>((t) => (t.id === tag.id ? tag : t));
        return result;
      };

      mutateOptimistic(KEYS.TAG_LIST, updater);

      return this.service.updateTag(tag).pipe(
        withLatestFrom(this.tags$),
        tap(([updatedTag, { data }]) => {
          const allTags = [...data];
          const foundIndex = data.findIndex((tag) => updatedTag.id === tag.id);
          if (foundIndex) {
            allTags[foundIndex] = updatedTag;
          }
          mutateSuccess(KEYS.TAG_LIST, allTags);
        }),
        map(([updatedTag]) => updatedTag),
        catchError((err) => {
          mutateError(KEYS.TAG_LIST, err);
          return throwError(err);
        }),
      );
    },
  }).pipe(shareReplay());

  onCreate(newTag: TagType) {
    mutateOptimistic<TagType[]>(KEYS.TAG_LIST, (tags) => updater(tags, newTag));
    const updater = (tags: TagType[], newTag: TagType) => {
      tags.unshift(newTag);
      return tags;
    };

    this.service
      .createTag(newTag)
      .pipe(
        catchError((err) => {
          mutateError(KEYS.TAG_LIST, err);
          return throwError(err);
        }),
      )
      .subscribe((createdTag) => {
        mutateSuccess<TagType[]>(KEYS.TAG_LIST, (tags) => updater(tags.slice(1), createdTag));
      });
  }

  onDestroy(destroyedTag: TagType) {
    mutateOptimistic<TagType[]>(KEYS.TAG_LIST, (tags) => updater(tags, destroyedTag));
    const updater = (tags: TagType[], destroyedTag?: TagType) => {
      if (!destroyedTag) return tags;
      return tags.filter((tag) => tag.id !== destroyedTag.id);
    };

    this.service
      .deleteTag(destroyedTag)
      .pipe(
        catchError((err) => {
          mutateError(KEYS.TAG_LIST, err);
          return throwError(err);
        }),
      )
      .subscribe((deletedTag) => {
        mutateSuccess<TagType[]>(KEYS.TAG_LIST, (tags) => updater(tags, deletedTag));
      });
  }

  trackById(index, item) {
    return item.id || index;
  }
}
