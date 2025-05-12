import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Fidelite } from 'src/app/models/fidelite';
import { PointHistory } from 'src/app/models/point-history';


@Injectable({
  providedIn: 'root'
})
export class FidelityService {
  private apiUrl = 'http://localhost:8082/api/fidelite';

  constructor(private http: HttpClient) {}

  getFidelities(search?: string): Observable<Fidelite[]> {
    const url = search ? `${this.apiUrl}?search=${encodeURIComponent(search)}` : this.apiUrl;
    return this.http.get<Fidelite[]>(url).pipe(catchError(this.handleError));
  }

  getFidelityById(id: number): Observable<Fidelite> {
    return this.http.get<Fidelite>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  getPointHistory(userId: number): Observable<PointHistory[]> {
    return this.http.get<PointHistory[]>(`${this.apiUrl}/history/${userId}`).pipe(catchError(this.handleError));
  }

  addPoints(userId: number, points: number): Observable<string> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('points', points.toString());
    return this.http.post<string>(`${this.apiUrl}/ajouter-points`, formData).pipe(catchError(this.handleError));
  }

  deleteFidelity(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status} - ${error.error || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}