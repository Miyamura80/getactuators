-- Extract behind /patents (scripts/patents/build-landscape.ts). One row per
-- publication with a priority date from 2010 and at least one CPC code in a
-- deliberately broad superset; src/patents/technologies.ts narrows it per
-- technology. Source: Google Patents Public Datasets on BigQuery
-- (patents-public-data.patents.publications, CC BY 4.0).
--
-- Replace PROJECT_ID and BUCKET, then run both statements. The raw export is
-- not committed; the build script reads it from a path or URL.

CREATE OR REPLACE TABLE `PROJECT_ID.patents_extract.actuator_pubs` AS
SELECT
  p.publication_number,
  p.family_id,
  p.country_code,
  p.kind_code,
  p.priority_date,
  p.filing_date,
  p.publication_date,
  ARRAY(SELECT AS STRUCT a.name, a.country_code FROM UNNEST(p.assignee_harmonized) a) AS assignees,
  (SELECT t.text FROM UNNEST(p.title_localized) t WHERE t.language = 'en' LIMIT 1) AS title_en,
  ARRAY(SELECT c.code FROM UNNEST(p.cpc) c) AS cpc_codes
FROM `patents-public-data.patents.publications` p
WHERE p.priority_date >= 20100101
  AND EXISTS (
    SELECT 1 FROM UNNEST(p.cpc) c
    WHERE REGEXP_CONTAINS(c.code, r'^(B25J9/|B25J17/|F16H49/00|F16H1/28|F16H1/32|F16H1/46|F16H25/2|H01F1/057|H01F1/059|H01F41/02|H02K1/24|H02K19/|H02K21/24|H02K1/27|H02N1/|H10N30/857|F03G7/0|F15B15/18|F15B7/00)')
  );

EXPORT DATA OPTIONS (
  uri = 'gs://BUCKET/actuator_pubs/part-*.json.gz',
  format = 'JSON',
  compression = 'GZIP',
  overwrite = true
) AS
SELECT * FROM `PROJECT_ID.patents_extract.actuator_pubs`;
