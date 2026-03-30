import { onRequestGet as __api_admin_stats_js_onRequestGet } from "C:\\Users\\owner\\Desktop\\Antigravity\\cc-cherryblossom-ai-booth\\functions\\api\\admin\\stats.js"
import { onRequestPost as __api_generate_step1_js_onRequestPost } from "C:\\Users\\owner\\Desktop\\Antigravity\\cc-cherryblossom-ai-booth\\functions\\api\\generate\\step1.js"
import { onRequestPost as __api_share__id__js_onRequestPost } from "C:\\Users\\owner\\Desktop\\Antigravity\\cc-cherryblossom-ai-booth\\functions\\api\\share\\[id].js"
import { onRequestPost as __api_process_js_onRequestPost } from "C:\\Users\\owner\\Desktop\\Antigravity\\cc-cherryblossom-ai-booth\\functions\\api\\process.js"

export const routes = [
    {
      routePath: "/api/admin/stats",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_stats_js_onRequestGet],
    },
  {
      routePath: "/api/generate/step1",
      mountPath: "/api/generate",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_step1_js_onRequestPost],
    },
  {
      routePath: "/api/share/:id",
      mountPath: "/api/share",
      method: "POST",
      middlewares: [],
      modules: [__api_share__id__js_onRequestPost],
    },
  {
      routePath: "/api/process",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_process_js_onRequestPost],
    },
  ]