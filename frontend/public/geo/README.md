# Map outlines

TopoJSON for the map kit (`frontend/src/components/maps/`). Each file is under
300 KB; `tests/supply-chain/map-kit.test.ts` checks the sizes and properties.

| File | Content | Source scale | Properties |
|------|---------|--------------|------------|
| `world-110m.json` | Countries, Antarctica dropped | 1:110m admin-0 | `iso` (ISO 3166-1 alpha-2), `name` |
| `world-50m.json` | Countries, simplified to 30% | 1:50m admin-0 | `iso`, `name` |
| `jp-admin1.json` | Japan, 47 prefectures | 1:10m admin-1, 15% | `code` (ISO 3166-2), `name` |
| `cn-admin1.json` | China, provinces | 1:10m admin-1, 15% | `code`, `name` |
| `kr-admin1.json` | South Korea, 17 provinces and cities | 1:10m admin-1, 15% | `code`, `name` |
| `us-admin1.json` | United States, 50 states and DC | 1:10m admin-1, 15% | `code`, `name` |

## Licence

Made with [Natural Earth](https://www.naturalearthdata.com/), free vector and
raster map data, which is in the public domain. The GeoJSON came from the
[natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
repository (`geojson/ne_110m_admin_0_countries`, `ne_50m_admin_0_countries`,
`ne_10m_admin_1_states_provinces`). Natural Earth draws boundaries as they are
administered on the ground; the atlas shows them without endorsing any claim.

## Rebuilding

With [mapshaper](https://github.com/mbloch/mapshaper) (`bunx mapshaper`):

```bash
# world: iso from ISO_A2_EH ("-99" becomes empty), Antarctica dropped
mapshaper -i ne_110m_admin_0_countries.geojson -filter 'ISO_A2_EH != "AQ"' \
  -each 'iso=ISO_A2_EH=="-99"?"":ISO_A2_EH, name=NAME' -filter-fields iso,name \
  -rename-layers countries -o world-110m.json format=topojson quantization=1e5
# the 50m file adds: -simplify 30% keep-shapes
# admin-1, per country (JP, CN, KR, US):
mapshaper -i ne_10m_admin_1_states_provinces.geojson -filter "iso_a2 == 'JP'" \
  -simplify 15% keep-shapes -each 'code=iso_3166_2, name=name' \
  -filter-fields code,name -rename-layers admin1 \
  -o jp-admin1.json format=topojson quantization=1e5
```
