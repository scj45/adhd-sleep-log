import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

interface SleepLogSettings {
  defaultSleepTime: string;
  defaultEnergyMax: number;
  dexOptions: string;
}

const DEFAULT_SETTINGS: SleepLogSettings = {
  defaultSleepTime: '07:00',
  defaultEnergyMax: 5,
  dexOptions: 'none,am,pm'
};

class SleepLogModal extends Modal {
  constructor(app: App) { super(app); }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  }

  parseTime(timeStr: string): string {
    if (!timeStr) return "0h 0m";
    const [hours, mins] = timeStr.split(':');
    return `${hours}h ${mins}m`;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('sleep-log-modal');

    const dateRow = contentEl.createEl('p');
    dateRow.createEl('label', { text: 'Sleep date:' });
    const dateInput = dateRow.createEl('input', { attr: { id: 'sleep_date', type: 'date' } });
    dateInput.value = new Date().toISOString().split('T')[0];
    dateRow.createEl('small', { text: '(DD-MM-YYYY)' }).style.color = 'gray';

    contentEl.createEl('h3', { text: 'ADHD Sleep Log' });
    contentEl.createEl('p', { text: `File: ${this.app.workspace.getActiveFile()?.basename || 'Today'}` });

    const timeRow = contentEl.createEl('p');
    timeRow.createEl('label', { text: 'Total sleep:' });
    const timeInput = timeRow.createEl('input', { attr: { id: 'total_sleep_time', type: 'time' } });
    timeInput.value = (this.app.plugins.plugins['sleep-log'] as any)?.settings?.defaultSleepTime || '07:00';

    const fields = [
      { id: 'deep_sleep_min', label: 'Deep sleep (min):', type: 'number' },
      { id: 'light_sleep_min', label: 'Light sleep (min):', type: 'number' },
      { id: 'rem_sleep_min', label: 'REM sleep (min):', type: 'number' },
      { id: 'awake_min', label: 'Awake time (min):', type: 'number' },
      { id: 'restless_moments', label: 'Restless moments:', type: 'number' },
      { id: 'energy', label: 'Energy (1-5):', type: 'number', min: '1', max: '5' }
    ];
    fields.forEach(field => {
      const row = contentEl.createEl('p');
      row.createEl('label', { text: field.label });
      const inp = row.createEl('input', { attr: { id: field.id, type: field.type, ...(field.min && {min: field.min}), ...(field.max && {max: field.max}) } });
      if (field.id === 'energy') inp.max = ((this.app.plugins.plugins['sleep-log'] as any)?.settings?.defaultEnergyMax || 5).toString();
    });

    const crashRow = contentEl.createEl('p'); crashRow.createEl('label', { text: 'Crash-day?' });
    const crashSelect = crashRow.createEl('select', { attr: { id: 'crash_day' } });
    ['no', 'yes'].forEach(val => { const opt = crashSelect.createEl('option', { text: val, attr: { value: val } }); if (val === 'no') opt.selected = true; });

    const dexRow = contentEl.createEl('p'); dexRow.createEl('label', { text: 'Dexamfetamine:' });
    const dexSelect = dexRow.createEl('select', { attr: { id: 'dexamfetamine' } });
    const dexOpts = ((this.app.plugins.plugins['sleep-log'] as any)?.settings?.dexOptions || 'none,am,pm').split(',');
    dexOpts.forEach((val: string) => {
      const trimmed = val.trim();
      const opt = dexSelect.createEl('option', { text: trimmed, attr: { value: trimmed } });
      if (trimmed === 'am') opt.selected = true;
    });

    const saveBtn = contentEl.createEl('button', { text: 'Log to file', attr: { id: 'save_sleep_btn' } });
    saveBtn.style.marginTop = '10px'; saveBtn.style.padding = '8px 16px';
    saveBtn.onclick = async () => {
      // [Save logic same as before - omitted for brevity, copy from previous]
      const getVal = (id: string): string => (this.contentEl.querySelector(`#${id}`) as HTMLInputElement)?.value || '0';
      const getSel = (id: string): string => (this.contentEl.querySelector(`#${id}`) as HTMLSelectElement)?.value || '';
      const sleepDateISO = getVal('sleep_date');
      const timeStr = getVal('total_sleep_time');
      const today = new Date().toISOString().split('T')[0];

      const totalSleep = this.parseTime(timeStr);
      const sleepDateDisplay = sleepDateISO ? this.formatDate(sleepDateISO) : this.formatDate(today);

      const content = `---
sleep_date: ${sleepDateDisplay} (${sleepDateISO || today})
total_sleep: ${totalSleep}
deep_sleep_min: ${getVal('deep_sleep_min')}
light_sleep_min: ${getVal('light_sleep_min')}
rem_sleep_min: ${getVal('rem_sleep_min')}
awake_min: ${getVal('awake_min')}
restless_moments: ${getVal('restless_moments')}
next_day_energy_1-5: ${getVal('energy')}
crash_day: ${getSel('crash_day')}
dexamfetamine: ${getSel('dexamfetamine')}
med_notes:

# Sleep Log (ADHD-style)
Date: ${sleepDateDisplay} | Sleep: ${totalSleep}
- Deep: ${getVal('deep_sleep_min')} min | Light: ${getVal('light_sleep_min')} | REM: ${getVal('rem_sleep_min')} | Awake: ${getVal('awake_min')}
- Restless: ${getVal('restless_moments')} | Energy: ${getVal('energy')}/5 | Crash: ${getSel('crash_day')} | Dex: ${getSel('dexamfetamine')}
`;

      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        await this.app.vault.append(activeFile, '\\n\\n' + content);
        new Notice(`Sleep logged for ${sleepDateDisplay}!`, 2000);
        this.close();
      }
    };
  }

  onClose() { this.contentEl.empty(); }
}

export default class SleepLogPlugin extends Plugin {
  settings: SleepLogSettings;

  async onload() {
    await this.loadSettings();
    this.addRibbonIcon('bed', 'ADHD Sleep Log', () => new SleepLogModal(this.app).open());
    this.addSettingTab(new SleepLogSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SleepLogSettingTab extends PluginSettingTab {
  plugin: SleepLogPlugin;

  constructor(app: App, plugin: SleepLogPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Default sleep time')
      .setDesc('Default HH:MM in modal (e.g., 07:00)')
      .addText(text => text
        .setPlaceholder('07:00')
        .setValue(this.plugin.settings.defaultSleepTime)
        .onChange(async (value) => {
          this.plugin.settings.defaultSleepTime = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Energy scale max')
      .setDesc('Max value for energy slider (1-X)')
      .addSlider(slider => slider
        .setLimits(3, 10)
        .setValue(this.plugin.settings.defaultEnergyMax)
        .onChange(async (value) => {
          this.plugin.settings.defaultEnergyMax = Math.floor(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Dexamfetamine options')
      .setDesc('Comma-separated dropdown values (e.g., none,am,pm,high)')
      .addText(text => text
        .setPlaceholder('none,am,pm')
        .setValue(this.plugin.settings.dexOptions)
        .onChange(async (value) => {
          this.plugin.settings.dexOptions = value;
          await this.plugin.saveSettings();
        }));
  }
}
