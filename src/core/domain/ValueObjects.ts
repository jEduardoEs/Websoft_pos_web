export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string = 'GTQ') {
    if (isNaN(amount)) {
      throw new Error('Monto de dinero invalido');
    }
    this._amount = Math.round(amount * 100) / 100;
    this._currency = currency;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  public add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('No se pueden sumar monedas distintas');
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  public subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('No se pueden restar monedas distintas');
    }
    return new Money(Math.max(0, this._amount - other._amount), this._currency);
  }

  public multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency);
  }

  public format(): string {
    return `${this._currency === 'GTQ' ? 'Q' : '$'} ${this._amount.toFixed(2)}`;
  }
}

export class NitNumber {
  private readonly _value: string;

  constructor(value: string) {
    const clean = (value || 'CF').trim().toUpperCase();
    this._value = clean === '' ? 'CF' : clean;
  }

  get value(): string {
    return this._value;
  }

  public isConsumidorFinal(): boolean {
    return this._value === 'CF';
  }
}

export class Percentage {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('El porcentaje debe estar entre 0 y 100');
    }
    this._value = Math.round(value * 100) / 100;
  }

  get value(): number {
    return this._value;
  }

  public applyTo(money: Money): Money {
    return money.multiply(this._value / 100);
  }
}
