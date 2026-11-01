import { useMemo } from 'react'
import { catalogService } from '../services/catalogService'
import { useFetch } from './useFetch'

export function useCatalogs() {
  const zones = useFetch(catalogService.getZones)
  const categories = useFetch(catalogService.getCategories)

  const zoneNames = useMemo(
    () => new Map((zones.data ?? []).map((zone) => [zone.id, zone.name])),
    [zones.data],
  )
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    [categories.data],
  )

  return {
    zones: zones.data ?? [],
    categories: categories.data ?? [],
    zoneNames,
    categoryNames,
  }
}