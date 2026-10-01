import * as allure from 'allure-js-commons'

const QA_SPEC = 'docs/qa/test-spec-waitlist-telephone-path-and-slot-rules.md'

export interface CaseMeta {
  id: string
  feature: string
  story: string
  severity: 'critical' | 'normal' | 'minor'
  tag: 'positive' | 'negative' | 'permission' | 'concurrency' | 'boundary'
  gap?: string
}

export async function describeCase(meta: CaseMeta): Promise<void> {
  await allure.epic('Specialist Waitlist')
  await allure.feature(meta.feature)
  await allure.story(meta.story)
  await allure.severity(meta.severity)
  await allure.tag(meta.tag)
  await allure.link(QA_SPEC, meta.id, 'tms')
  if (meta.gap) await allure.tag(meta.gap)
}
