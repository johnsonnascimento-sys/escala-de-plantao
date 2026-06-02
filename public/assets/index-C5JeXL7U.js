const bootstrap = async () => {
  const cssUrl = new URL("./app-latest.css", import.meta.url);
  const jsUrl = new URL("./app-latest.js", import.meta.url);

  if (!document.querySelector('link[data-app-latest-css="true"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl.href;
    link.dataset.appLatestCss = "true";
    document.head.appendChild(link);
  }

  await import(jsUrl.href);
};

bootstrap().catch((error) => {
  console.error("Falha ao carregar a versao atual da aplicacao.", error);
  throw error;
});
