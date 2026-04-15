import { supabase } from "./supabase";

export interface Brand {
  id: number;
  name: string;
}

export interface Model {
  id: number;
  brand_id: number;
  name: string;
  mockup_url: string;
}

export interface CustomFieldValue {
  value: string | boolean;
  label: string;
  type: string;
  option_label?: string;
  price_impact?: number;
  image_url?: string;
}

export interface Order {
  id: number;
  brand_name: string;
  model_name: string;
  custom_name: string;
  product_name?: string;
  text_color: string;
  image_url: string;
  original_image_url: string;
  final_image_url: string;
  print_image_url?: string;
  design_image_url?: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  observations: string;
  status: string;
  custom_field_values?: Record<string, CustomFieldValue>;
  order_value?: number;
  locker_id?: number | null;
  created_at: string;
}

export async function createOrder(order: {
  brand_name: string;
  model_name: string;
  custom_name: string;
  product_name?: string;
  text_color: string;
  image_url: string;
  original_image_url: string;
  final_image_url: string;
  print_image_url?: string;
  design_image_url?: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  observations: string;
  shipping_method?: string;
  order_source?: string;
  custom_field_values?: Record<string, CustomFieldValue>;
  cross_sell_items?: Array<{ product_id: number; name: string; price: number; image_url: string }>;
  product_category_slugs?: string[];
  order_value?: number;
  locker_id?: number | null;
}): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...order, status: "in procesare" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrder(id: number): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}
