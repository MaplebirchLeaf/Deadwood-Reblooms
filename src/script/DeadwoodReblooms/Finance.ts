export default function FinanceCheats(core: typeof maplebirch): void {
  core.tool.defineS('deadwood-finance-cheats', (body = false) => {
    const finance = core.get('VanillaPlus')?.finance;
    if (!finance) return '';
    const bank = V.VanillaPlus.finance.bank;
    T.deadwoodBankStepper = {
      activeButtons: ['single', 'double', 'triple'],
      step: 1000,
      min: 0,
      max: 10000000000,
      colorArr: ['--yellow'],
      percentage: false,
      valueFormat: (value: number) => `<b>${window.formatMoney(value)}</b>`,
      callback: (value: number) => {
        if (!Number.isSafeInteger(value) || value < 0 || value > 10000000000 || !bank.opened) return;
        V.moneyStats.cheats.earned += value - bank.balance;
        bank.balance = value;
      }
    };
    const wrap = (content: string) => (body ? content : `<div id='deadwood-bank-cheats'>${content}</div>`);
    if (!bank.opened)
      return wrap(`<br>${lanSwitch('Bank account: Not opened', '银行账户：未开户')} |
      <<lanLink ['Unlock', '解锁']>><<run maplebirch.get('VanillaPlus').finance.openBankAccount()>>
        <<replace '#deadwood-bank-cheats'>><<deadwood-finance-cheats true>><</replace>>
      <</lanLink>><br>`);
    const card = (name: string, active: boolean, method: string) =>
      `${name}: ${active ? lanSwitch('Unlocked', '已解锁') : `<<linkreplace ${JSON.stringify(lanSwitch('Unlock', '解锁'))}>><<run maplebirch.get('VanillaPlus').finance.${method}()>>${lanSwitch('Unlocked', '已解锁')}<</linkreplace>>`}`;
    return wrap(`<br>${lanSwitch('Bank account: Open', '银行账户：已开户')}<br>
      <<numberStepper ${JSON.stringify(lanSwitch('Bank balance', '银行存款'))} $VanillaPlus.finance.bank.balance _deadwoodBankStepper>>
      ${card(lanSwitch('Debit card', '借记卡'), bank.debit_card, 'issueDebitCard')} |
      ${card(lanSwitch('Credit card', '信用卡'), bank.credit_card, 'issueCreditCard')}<br>`);
  });
}
