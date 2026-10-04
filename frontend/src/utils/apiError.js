/**
 * Xu ly loi API o mot cho duy nhat.
 *
 * Boi canh: truoc day gan 60 loi goi API trong du an ket thuc bang mot khoi catch
 * chi lam dung mot viec la nem lai chinh loi do. Nem lai trong catch ma khong co ai
 * bat tiep se tao ra mot "unhandled promise rejection". Trong che do dev, CRA bat su
 * kien do va dap len man hinh overlay do "Uncaught runtime errors", nen chi can mot
 * request that bai la nguoi dung khong thao tac duoc gi nua.
 *
 * Cach lam hien tai: api/axiosConfig.js ghi log chi tiet cho MOI request that bai
 * (method, url, status, body). Vi vay call site khong can log lai, chi can khong de
 * rejection lan ra ngoai.
 */

/**
 * Dung o .catch() cua nhung loi goi API ma component KHONG co hanh dong hoi phuc
 * rieng: khong hien thong bao, khong dieu huong, khong doi state.
 *
 * Co y dat ten ro rang thay vi viet .catch(() => {}): grep "ignoreApiError" se liet
 * ke dung nhung cho dang bo qua loi, tien cho viec bo sung xu ly that ve sau.
 *
 * Neu component CO hanh dong hoi phuc thi viet .catch rieng, dung ham nay.
 */
export const ignoreApiError = () => {};

/**
 * Lay thong diep loi doc duoc tu mot loi cua axios, de hien cho nguoi dung.
 *
 * Backend tra ve nhieu dang khac nhau:
 *   - ResponseDTO:  { status, message, data }
 *   - loi mac dinh cua Spring: { timestamp, status, error, path }
 *   - ma so tran cho trang thai tai khoan: 1001 / 1002 / 1003
 * Ham nay chuan hoa lai de UI khong phai doan.
 */
export const resolveApiErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }
  if (typeof data === "string") {
    return data;
  }
  if (typeof data === "number") {
    return fallback;
  }
  return data.message || data.error || fallback;
};
