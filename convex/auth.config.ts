// Файл выполняется при деплое в Node-окружении; типы node не подключены.
declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
