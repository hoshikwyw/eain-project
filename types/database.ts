/**
 * Database types for the tables Part B touches.
 *
 * Hand-written to match supabase/migrations. Once a project is linked,
 * regenerate the full file with:
 *   pnpm dlx supabase gen types typescript --linked > types/database.ts
 * and delete this notice.
 */

export type UserRole = "user" | "admin";
export type GiftStatus = "draft" | "published" | "unpublished" | "deleted";
export type GiftType = "postcard" | "website" | "memory" | "interactive";
export type GiftEventType =
  | "created"
  | "published"
  | "unpublished"
  | "shared"
  | "qr_generated"
  | "opened"
  | "viewed"
  | "response_started"
  | "responded"
  | "link_regenerated"
  | "deleted";
export type PointTransactionType = "earn" | "purchase" | "spend" | "refund" | "bonus";
export type NotificationType = "gift_opened" | "response_received" | "points_earned" | "system";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile extends Record<string, unknown> {
  id: string;
  display_name: string;
  avatar_url: string | null;
  locale: "en" | "my";
  role: UserRole;
  points_balance: number;
  notify_on_open: boolean;
  notify_on_response: boolean;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction extends Record<string, unknown> {
  id: string;
  user_id: string;
  type: PointTransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface Notification extends Record<string, unknown> {
  id: string;
  user_id: string;
  type: NotificationType;
  gift_id: string | null;
  title_key: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
}

export interface Gift extends Record<string, unknown> {
  id: string;
  sender_id: string;
  template_id: string;
  title: string;
  status: GiftStatus;
  share_token: string;
  theme: Json;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
}

export interface GiftEvent extends Record<string, unknown> {
  id: string;
  gift_id: string;
  recipient_id: string | null;
  event_type: GiftEventType;
  session_id: string | null;
  created_at: string;
}

export interface GiftResponse extends Record<string, unknown> {
  id: string;
  gift_id: string;
  recipient_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface Category extends Record<string, unknown> {
  id: string;
  slug: string;
  name_en: string;
  name_my: string;
  sort_order: number;
  is_active: boolean;
}

export interface Template extends Record<string, unknown> {
  id: string;
  slug: string;
  category_id: string;
  gift_type: GiftType;
  name_en: string;
  name_my: string;
  description_en: string;
  description_my: string;
  preview_path: string | null;
  is_premium: boolean;
  point_price: number;
  default_theme: Json;
  default_sections: Json;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** No columns may be written by the client. Server functions own these rows. */
type ReadOnly = Record<string, never>;

type Table<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown> = Partial<Row>,
  Update extends Record<string, unknown> = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        ReadOnly,
        Pick<Partial<Profile>, "display_name" | "avatar_url" | "locale" | "notify_on_open" | "notify_on_response">
      >;
      point_transactions: Table<PointTransaction, ReadOnly, ReadOnly>;
      notifications: Table<Notification, ReadOnly, Pick<Partial<Notification>, "read_at">>;
      gifts: Table<
        Gift,
        Pick<Gift, "sender_id" | "template_id"> & Partial<Pick<Gift, "title" | "theme">>,
        Partial<Pick<Gift, "title" | "status" | "theme" | "template_id" | "deleted_at">>
      >;
      gift_events: Table<GiftEvent, ReadOnly, ReadOnly>;
      gift_responses: Table<GiftResponse, ReadOnly, ReadOnly>;
      categories: Table<Category>;
      templates: Table<Template>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      gift_status: GiftStatus;
      gift_type: GiftType;
      gift_event_type: GiftEventType;
      point_transaction_type: PointTransactionType;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
