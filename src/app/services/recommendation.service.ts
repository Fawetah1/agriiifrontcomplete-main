// recommendation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = 'http://localhost:8082/api/recommendations';

  constructor(private http: HttpClient) {}

  getRecommendedProducts(userId: number, limit: number = 6): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&limit=${limit}`).pipe(
      catchError(error => {
        console.error('Error:', error);
        return of([]);
      })
    );
  }
}