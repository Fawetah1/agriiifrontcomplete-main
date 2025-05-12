export interface AuditLog {
    id: number;
    action: string;
    performedBy: string;
    targetUser: string;
    dateAction: string;
  }
  