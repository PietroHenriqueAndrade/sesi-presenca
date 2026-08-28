const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const TIMEZONE = 'America/Sao_Paulo';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(TIMEZONE);

class DateHelpers {
  static get timezone() {
    return TIMEZONE;
  }

  static agoraDayjs() {
    return dayjs().tz(TIMEZONE);
  }

  static agora() {
    return this.agoraDayjs().toDate();
  }

  static emBrasilia(valor) {
    if (valor === undefined || valor === null || valor === '') return this.agoraDayjs();

    // Datas de calendário (YYYY-MM-DD) não representam um instante UTC. Criá-las
    // diretamente no fuso de São Paulo evita o clássico deslocamento para o dia
    // anterior quando o servidor/CI roda em UTC.
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      const dataLocal = dayjs.tz(`${valor}T00:00:00`, TIMEZONE);
      return dataLocal.isValid() ? dataLocal : null;
    }

    const data = dayjs(valor);
    if (!data.isValid()) return null;
    return data.tz(TIMEZONE);
  }

  static inicioDoDia(valor) {
    const data = this.emBrasilia(valor);
    return data ? data.startOf('day').toDate() : null;
  }

  static fimDoDia(valor) {
    const data = this.emBrasilia(valor);
    return data ? data.endOf('day').toDate() : null;
  }

  static inicioDoDiaAtual() {
    return this.agoraDayjs().startOf('day').toDate();
  }

  static fimDoDiaAtual() {
    return this.agoraDayjs().endOf('day').toDate();
  }


  static dataHojeDb(deslocamentoDias = 0) {
    const ymd = this.agoraDayjs().add(deslocamentoDias, 'day').format('YYYY-MM-DD');
    return new Date(`${ymd}T00:00:00.000Z`);
  }

  static dataDb(valor) {
    const data = valor ? this.emBrasilia(valor) : this.agoraDayjs();
    if (!data) return null;
    return new Date(`${data.format('YYYY-MM-DD')}T00:00:00.000Z`);
  }

  static formatarDataBr(data) {
    return dayjs(data).tz(TIMEZONE).format('DD/MM/YYYY');
  }

  static formatarDataHoraBr(data) {
    return dayjs(data).tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss');
  }

  static horarioDeCorteCozinha() {
    return this.agoraDayjs().hour(10).minute(0).second(0).millisecond(0).toDate();
  }
}

module.exports = DateHelpers;
