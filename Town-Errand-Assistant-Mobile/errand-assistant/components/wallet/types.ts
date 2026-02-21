export type Card = {
    id: string;
    storeName?: string;
    cardName?: string;
    barcode?: string;
    color?: string;
    image?: string | null;
    createdAt?: string;
};

export type UsageEntry = {
    id: string;
    cardId: string;
    shopName: string;
    date: string;
};
