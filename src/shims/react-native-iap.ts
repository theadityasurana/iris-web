/** In-app purchases only exist on the phone; the website uses Dodo Payments. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Purchase = any;
export type PurchaseError = any;
const unavailable = async (..._args: any[]): Promise<any> => { throw new Error('In-app purchases are not available on the web'); };
export const initConnection = async (..._args: any[]) => false;
export const endConnection = async (..._args: any[]) => {};
export const fetchProducts = async (..._args: any[]): Promise<any[]> => [];
export const getAvailablePurchases = async (..._args: any[]): Promise<any[]> => [];
export const requestPurchase = unavailable;
export const finishTransaction = async (..._args: any[]) => {};
export const purchaseUpdatedListener = (..._args: any[]) => ({ remove() {} });
export const purchaseErrorListener = (..._args: any[]) => ({ remove() {} });
export default {};
