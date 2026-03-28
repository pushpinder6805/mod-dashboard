import { apiInitializer } from "discourse/lib/api";

import { initDashboard } from "../mod-dashboard/render";
import { loadAllData } from "../mod-dashboard/api";
import { setupFilters } from "../mod-dashboard/filters";

export default apiInitializer("0.11", (api) => {
  api.onPageChange(async (url) => {
    if (!url.includes("/review")) return;

    const user = api.getCurrentUser();
    if (!user || !(user.staff || user.admin)) return;

    if (document.querySelector(".mod-dashboard")) return;

    const container = initDashboard();

    document.querySelector("#main-outlet")?.prepend(container);

    const data = await loadAllData();

    // render all sections
    renderAll(container, data);

    setupFilters(container);
  });
});
