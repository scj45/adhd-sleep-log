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

// Types for plugin access (no 'any')
interface SleepLogPluginInstance extends Plugin {
  settings: SleepLogSettings;
}

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

    // Date picker
    const dateRow = contentEl.createEl('p');
    dateRow.createEl('label', { text: 'Sleep date' });
    const dateInput = dateRow.createEl('input', { attr: { id: 'sleep_date', type: 'date' } });
    dateInput.value = new Date().toISOString().split('T')[0];
    const formatHint = dateRow.createEl('small');
    formatHint.setText('(dd-mm-yyyy)');
    formatHint.addClass('format-hint');  // CSS class instead of style

    contentEl.createEl('h3', { text: 'Adhd sleep log' });  // Sentence case
    contentEl.createEl('p', { text: `Active file: ${this.app.workspace.getActiveFile()?.basename || 'None'}` });  // Sentence case

    // Time input
    const timeRow = contentEl.createEl('p');
    timeRow.createEl('label', { text: 'Total sleep' });
    const timeInput = timeRow.createEl('input', { attr: { id: 'total_sleep_time', type: 'time' } });
    const plugin = this.app.plugins.plugins['sleep-log'] as SleepLogPluginInstance | undefined;
    timeInput.value = plugin?.settings?.defaultSleepTime ?? '07:00';

    // Fields (sentence case labels)
    const fields = [
      { id: 'deep_sleep_min', label: 'Deep sleep (min)', type: 'number' },
      { id: 'light_sleep_min', label: 'Light sleep (min)', type: 'number' },
      { id: 'rem_sleep_min', label: 'Rem sleep (min)', type: 'number' },
      { id: 'awake_min', label: 'Awake time (min)', type: 'number' },
      { id: 'restless_moments', label: 'Restless moments', type: 'number' },
      { id: 'energy', label: 'Energy (1-5)', type: 'number', min: 1, max: 5 }
    ];

    fields.forEach(field => {
      const row = contentEl.createEl('p');
      row.createEl('label', { text: field.label });
      const inputEl = row.createEl('input', { 
        attr: { 
          id: field.id, 
          type: field.type, 
          min: field.min?.toString(), 
          max: field.max?.toString() 
        } 
      });
      if (field.id === 'energy' && plugin) {
        inputEl.setAttr('max', plugin.settings.defaultEnergyMax.toString());
      }
    });

    // Dropdowns (sentence case)
    const crashRow = contentEl.createEl('p');
    crashRow.createEl('label', { text: 'Crash day?' });
    const crashSelect = crashRow.createEl('select', { attr: { id: 'crash_day' } });
    ['No', 'Yes'].forEach(val => {
      const opt = crashSelect.createEl('option', { text: val, attr: { value: val.toLowerCase() } });
      if (val === 'No') opt.selected = true;
    });

    const dexRow = contentEl.createEl('p');
    dexRow.createEl('label', { text: 'Dexamfetamine' });
    const dexSelect = dexRow.createEl('select', { attr: { id: 'dexamfetamine' } });
    const dexOpts = (plugin?.settings.dexOptions ?? 'none,am,pm').split(',');
    dexOpts.forEach(val => {
      const trimmed = val.trim();
      if (trimmed) {
        const opt = dexSelect.createEl('option', { text: trimmed.charAt(0).toUpperCase() + trimmed.slice(1), attr: { value: trimmed } });
        if (trimmed === 'am') opt.selected = true;
      }
    });

    // Save button (CSS class for styling)
    const saveBtn = contentEl.createEl('button', { text: 'Log to file', attr: { id: 'save_sleep_btn' } });
    saveBtn.addClass('save-button');  // CSS instead of inline styles
  }

  onClose() {
    this.contentEl.empty();
  }
}

export default class SleepLogPlugin extends Plugin {
  settings: SleepLogSettings;

  async onload() {
    await this.loadSettings();
    this.addRibbonIcon('bed', 'Adhd sleep log', () => new SleepLogModal(this.app).open());  // Sentence case
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
      .setDesc('Default time shown in modal')
      .addText(text => text
        .setPlaceholder('07:00')
        .setValue(this.plugin.settings.defaultSleepTime)
        .onChange(async (value) => {
          this.plugin.settings.defaultSleepTime = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Energy scale maximum')
      .setDesc('Maximum value for energy rating (1-X)')
      .addSlider(slider => slider
        .setLimits(3, 10)
        .setValue(this.plugin.settings.defaultEnergyMax)
        .onChange(async (value) => {
          this.plugin.settings.defaultEnergyMax = Math.floor(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Dexamfetamine options')
      .setDesc('Comma-separated values (e.g., none,am,pm)')
      .addText(text => text
        .setPlaceholder('none,am,pm')
        .setValue(this.plugin.settings.dexOptions)
        .onChange(async (value) => {
          this.plugin.settings.dexOptions = value;
          await this.plugin.saveSettings();
        }));
  }
}
