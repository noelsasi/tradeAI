import type { Job, ResultRow } from '@/domain/classification/types.js';

function escapeXml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripDots(hsCode: string): string {
  return hsCode.replace(/\./g, '');
}

export function buildMirsalXml(job: Job, results: ResultRow[]): string {
  const declarationDate = new Date().toISOString().split('T')[0];
  const refNo = job.file_name?.replace(/\.pdf$/i, '') ?? job.id;

  const goodItems = results
    .filter((r) => r.hs_code)
    .map((r) => {
      const hsCode = r.user_overridden && r.user_override_code
        ? stripDots(r.user_override_code)
        : stripDots(r.hs_code ?? '');

      return `    <GoodItem>
      <ItemNumber>${r.line_number}</ItemNumber>
      <HSCode>${escapeXml(hsCode)}</HSCode>
      <Description>${escapeXml(r.raw_description)}</Description>
      <OriginCountry></OriginCountry>
      <Quantity></Quantity>
      <UnitOfMeasure>PCE</UnitOfMeasure>
      <CustomsValue></CustomsValue>
    </GoodItem>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomsDeclaration>
  <DeclarationHeader>
    <DeclarantCode></DeclarantCode>
    <DeclarationDate>${declarationDate}</DeclarationDate>
    <ReferenceNo>${escapeXml(refNo)}</ReferenceNo>
  </DeclarationHeader>
  <GoodItems>
${goodItems}
  </GoodItems>
</CustomsDeclaration>`;
}
