import { supabase } from "../lib/supabase";
import { PlayerDocument } from "../types/document";
import { HttpError } from "../utils/httpError";

const documentFields = "id, player_id, doc_type, file_url, uploaded_by, uploaded_at";

interface CreateDocumentInput {
  playerId: string;
  docType: PlayerDocument["doc_type"];
  fileUrl: string;
  uploadedBy: string;
}

export const listPlayerDocuments = async (playerId: string): Promise<PlayerDocument[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select(documentFields)
    .eq("player_id", playerId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as PlayerDocument[];
};

export const createPlayerDocument = async (input: CreateDocumentInput): Promise<PlayerDocument> => {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      player_id: input.playerId,
      doc_type: input.docType,
      file_url: input.fileUrl,
      uploaded_by: input.uploadedBy
    })
    .select(documentFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create document");
  }

  return data as PlayerDocument;
};

export const deletePlayerDocument = async (documentId: string, playerId: string): Promise<void> => {
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("player_id", playerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new HttpError(400, error.message);
  }

  if (!data) {
    throw new HttpError(404, "Document not found for player");
  }
};
