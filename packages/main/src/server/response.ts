export type SuccessResponse<T> = {
  ok: true;
  data: T;
};

export const success = <T>(data: T): SuccessResponse<T> => ({
  ok: true,
  data,
});
