export type DocumentType = "id" | "passport" | "birth_certificate" | "contract" | "other";

export interface PlayerDocument {
  id: string;
  player_id: string;
  doc_type: DocumentType;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
}
