// O service worker do painel: só recebe os avisos de chat e abre a conversa
// no clique. Não guarda cache nem intercepta requisição nenhuma — um painel
// servido de cache velho seria pior que um painel lento.

self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { titulo: "LANÇA+", texto: evento.data ? evento.data.text() : "" };
  }

  evento.waitUntil(
    self.registration.showNotification(dados.titulo || "LANÇA+", {
      body: dados.texto || "",
      icon: "/painel-icone.png",
      badge: "/painel-icone.png",
      tag: dados.tag || undefined,
      renotify: Boolean(dados.tag),
      data: { url: dados.url || "/lncadmin/conversas" },
    })
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL(
    (evento.notification.data && evento.notification.data.url) ||
      "/lncadmin/conversas",
    self.location.origin
  ).href;

  evento.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Reaproveita uma aba do painel já aberta, em vez de abrir outra.
      for (const janela of janelas) {
        if (new URL(janela.url).pathname.startsWith("/lncadmin")) {
          await janela.focus();
          return janela.navigate(destino);
        }
      }
      return self.clients.openWindow(destino);
    })()
  );
});
