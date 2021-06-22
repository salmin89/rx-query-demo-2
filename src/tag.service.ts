import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { query } from 'rx-query';
import { catchError, map, switchMap, delay } from 'rxjs/operators';
import { throwError } from 'rxjs';

export type TagType = {
  id?: string;
  name: string;
  color: string;
};

@Injectable({
  providedIn: 'root'
})
export class TagService extends HttpClient {
  BASE_URL = 'https://6089b8b68c8043001757f52f.mockapi.io/tags';

  getTagById(id: string | number) {
    return this.get<TagType>(`${this.BASE_URL}/${id}`).pipe(delay(1000));
  }

  getTags() {
    return this.get<TagType[]>(this.BASE_URL).pipe(delay(1000));
  }

  updateTag(tag: TagType) {
    return this.put<TagType>(`${this.BASE_URL}/${tag.id}`, tag).pipe(
      delay(1000)
    );
  }

  deleteTag(tag: TagType) {
    return this.delete<TagType>(`${this.BASE_URL}/${tag.id}`).pipe(delay(1000));
  }

  createTag(tag: TagType) {
    return this.post<TagType>(`${this.BASE_URL}`, tag).pipe(delay(1000));
  }
}
