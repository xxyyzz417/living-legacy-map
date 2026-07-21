const LEGAL_SIGNALS = [
  {
    id: 'not-a-will',
    regions: ['origin', 'destination'],
    when: () => true,
    title: '這張地圖不會取代遺囑',
    summary: '香港法例對遺囑的簽署和見證有正式要求。這裡只幫你整理意願，下載的草稿和 PDF 都不是遺囑。',
    lawyerQuestion: '我應怎樣把這份意願整理成符合香港法律要求的正式遺囑？',
    sourceName: '香港電子法例：第 30 章《遺囑條例》第 5 條',
    sourceUrl: 'https://www.elegislation.gov.hk/hk/cap30!en/s5?_lang=zh-Hant-HK',
    verifiedOn: '2026-07-21'
  },
  {
    id: 'joint-property',
    regions: ['home'],
    when: state => state.assets.some(item => item.regionId === 'home' && item.joint),
    title: '聯名物業可能有另一條路',
    summary: '聯權共有物業其中一名業主身故後，尚存聯權共有人可向土地註冊處登記核證死亡證明書以更新土地登記冊。先確認你的持有方式。',
    lawyerQuestion: '我的物業屬聯權共有還是分權共有，它會否按我寫下的意願處理？',
    sourceName: '香港政府 1823／土地註冊處：聯權共有人身故登記',
    sourceUrl: 'https://www.1823.gov.hk/tc/faq/if-one-of-the-joint-tenants-of-a-property-deceased-can-his-her-relatives-submit-the-death-certificate-to-the-land-registry-directly-for-registration',
    verifiedOn: '2026-07-21'
  },
  {
    id: 'mpf-estate',
    regions: ['beacon'],
    when: state => state.assets.some(item => item.regionId === 'beacon'),
    title: '強積金不是自動交給你心中那個人',
    summary: '積金局說明，身故成員的強積金屬於其遺產，並由遺產代理人提出申索。把希望照顧誰記下後，仍要讓律師核對正式安排。',
    lawyerQuestion: '我的強積金會怎樣進入遺產，遺產代理人需要哪些文件？',
    sourceName: '積金局：如何提取身故計劃成員的強積金',
    sourceUrl: 'https://www.mpfa.org.hk/info-centre/faq/employee/mpf-employee',
    verifiedOn: '2026-07-21'
  }
];

export function signalsForState(state) {
  return LEGAL_SIGNALS.filter(signal => signal.when(state));
}
