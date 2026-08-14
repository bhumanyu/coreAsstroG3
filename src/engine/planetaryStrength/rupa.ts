export function shastiamsaToRupa(shastiamsa: number): number {
  if (typeof shastiamsa !== 'number' || !Number.isFinite(shastiamsa)) {
    throw new TypeError('shastiamsa must be a finite number.');
  }
  return Number((shastiamsa / 60).toFixed(2));
}

export function rupaToShastiamsa(rupa: number): number {
  if (typeof rupa !== 'number' || !Number.isFinite(rupa)) {
    throw new TypeError('rupa must be a finite number.');
  }
  return Number((rupa * 60).toFixed(2));
}
