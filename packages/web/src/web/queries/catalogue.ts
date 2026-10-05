import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useCatalogue() {
  return useQuery(orpc.catalogue.list.queryOptions({ staleTime: 60000 }));
}
