import { normaliseAmount } from './state.js';

export function collectionForRecordType(recordType) {
  return {
    asset: 'assets',
    debt: 'debts',
    person: 'people',
    gift: 'gifts'
  }[recordType];
}

export function recordFromValues(meta, values = {}) {
  const amountMode = values.amountMode ?? 'unknown';
  const amount = amountMode === 'unknown' || amountMode === 'later'
    ? null
    : normaliseAmount(values.amount);

  if (amountMode === 'exact' && amount === null) {
    throw new Error('請輸入有效金額。');
  }

  if (meta.recordType === 'gift' && values.cause === 'none') {
    return {
      id: meta.id,
      regionId: meta.regionId,
      cause: 'none',
      declined: true,
      amountMode,
      amount: null,
      organisation: values.organisation ?? '',
      destination: values.destination ?? ''
    };
  }

  if (meta.recordType === 'asset') {
    return {
      id: meta.id,
      regionId: meta.regionId,
      label: values.label ?? '',
      amountMode,
      amount,
      destination: values.destination ?? '',
      joint: Boolean(values.joint),
      mortgage: Boolean(values.mortgage),
      overseas: Boolean(values.overseas)
    };
  }

  return {
    id: meta.id,
    regionId: meta.regionId,
    ...values,
    amountMode,
    amount
  };
}
