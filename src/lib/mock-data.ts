import { Brand, Model } from "./db";

export const mockBrands: Brand[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Samsung" },
  { id: 3, name: "Huawei" },
  { id: 4, name: "Xiaomi" },
  { id: 5, name: "OnePlus" },
  { id: 6, name: "Google" },
  { id: 7, name: "Oppo" },
  { id: 8, name: "Realme" },
  { id: 9, name: "Motorola" },
  { id: 10, name: "Nokia" },
];

const mockup = "/mockups/phone_generic.svg";

export const mockModels: Record<number, Model[]> = {
  1: [
    { id: 101, brand_id: 1, name: "iPhone 16 Pro Max", mockup_url: mockup },
    { id: 102, brand_id: 1, name: "iPhone 16 Pro", mockup_url: mockup },
    { id: 103, brand_id: 1, name: "iPhone 16", mockup_url: mockup },
    { id: 104, brand_id: 1, name: "iPhone 15 Pro Max", mockup_url: mockup },
    { id: 105, brand_id: 1, name: "iPhone 15 Pro", mockup_url: mockup },
    { id: 106, brand_id: 1, name: "iPhone 15", mockup_url: mockup },
    { id: 107, brand_id: 1, name: "iPhone 14 Pro Max", mockup_url: mockup },
    { id: 108, brand_id: 1, name: "iPhone 14", mockup_url: mockup },
    { id: 109, brand_id: 1, name: "iPhone 13", mockup_url: mockup },
  ],
  2: [
    { id: 201, brand_id: 2, name: "Galaxy S25 Ultra", mockup_url: mockup },
    { id: 202, brand_id: 2, name: "Galaxy S25+", mockup_url: mockup },
    { id: 203, brand_id: 2, name: "Galaxy S25", mockup_url: mockup },
    { id: 204, brand_id: 2, name: "Galaxy S24 Ultra", mockup_url: mockup },
    { id: 205, brand_id: 2, name: "Galaxy S24", mockup_url: mockup },
    { id: 206, brand_id: 2, name: "Galaxy A55", mockup_url: mockup },
    { id: 207, brand_id: 2, name: "Galaxy A35", mockup_url: mockup },
  ],
  3: [
    { id: 301, brand_id: 3, name: "P60 Pro", mockup_url: mockup },
    { id: 302, brand_id: 3, name: "P50 Pro", mockup_url: mockup },
    { id: 303, brand_id: 3, name: "Mate 50 Pro", mockup_url: mockup },
    { id: 304, brand_id: 3, name: "Nova 12", mockup_url: mockup },
    { id: 305, brand_id: 3, name: "P30 Pro", mockup_url: mockup },
  ],
  4: [
    { id: 401, brand_id: 4, name: "14 Ultra", mockup_url: mockup },
    { id: 402, brand_id: 4, name: "14 Pro", mockup_url: mockup },
    { id: 403, brand_id: 4, name: "14", mockup_url: mockup },
    { id: 404, brand_id: 4, name: "Redmi Note 13 Pro", mockup_url: mockup },
    { id: 405, brand_id: 4, name: "Redmi Note 13", mockup_url: mockup },
    { id: 406, brand_id: 4, name: "POCO X6 Pro", mockup_url: mockup },
  ],
  5: [
    { id: 501, brand_id: 5, name: "12", mockup_url: mockup },
    { id: 502, brand_id: 5, name: "11", mockup_url: mockup },
    { id: 503, brand_id: 5, name: "Nord 4", mockup_url: mockup },
  ],
  6: [
    { id: 601, brand_id: 6, name: "Pixel 9 Pro", mockup_url: mockup },
    { id: 602, brand_id: 6, name: "Pixel 9", mockup_url: mockup },
    { id: 603, brand_id: 6, name: "Pixel 8 Pro", mockup_url: mockup },
  ],
  7: [
    { id: 701, brand_id: 7, name: "Find X7 Ultra", mockup_url: mockup },
    { id: 702, brand_id: 7, name: "Reno 11 Pro", mockup_url: mockup },
  ],
  8: [
    { id: 801, brand_id: 8, name: "GT 5 Pro", mockup_url: mockup },
    { id: 802, brand_id: 8, name: "12 Pro+", mockup_url: mockup },
  ],
  9: [
    { id: 901, brand_id: 9, name: "Edge 50 Ultra", mockup_url: mockup },
    { id: 902, brand_id: 9, name: "Moto G84", mockup_url: mockup },
  ],
  10: [
    { id: 1001, brand_id: 10, name: "X30", mockup_url: mockup },
    { id: 1002, brand_id: 10, name: "G42", mockup_url: mockup },
  ],
};
