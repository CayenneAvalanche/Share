export const verifyFounderPinFn = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .handler(async ({ data }) => {
    checkPin(data.pin);
    return { ok: true as const };
  });
