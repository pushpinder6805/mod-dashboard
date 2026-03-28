import { apiInitializer } from "discourse/lib/api";
import { renderDashboard } from "../components/unified-feed";

export default apiInitializer("0.11", (api) => {
  api.onPageChange((url) => {
    if (!url.includes("/review")) return;

    const user = api.getCurrentUser();
    if (!user?.staff) return;

    if (document.querySelector(".mod-dashboard")) return;

    renderDashboard();
  });
});
