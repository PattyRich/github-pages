import { useState } from 'react';
import { getStoredBool, setStoredBool } from '../../utils/utils';
import { CheckboxField } from './FormControls';
import { ModalButton, ModalShell } from './ModalShell';
import './SettingsModal.css';

const SETTINGS_KEYS = [
  { key: 'completeStyle', label: 'Use alternative tile complete style?' },
  { key: 'showPoints', label: 'Hide current points on bingo board?' },
  { key: 'showTeamPoints', label: 'Hide team points on team tabs?' },
  { key: 'showTitleTile', label: 'Hide tile title on board?' },
  { key: 'showFeedback', label: 'Hide feedback button?' },
];

export default function SettingsModal({ handleClose }) {
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(SETTINGS_KEYS.map(({ key }) => [key, getStoredBool(key)]))
  );

  function toggle(key) {
    const newVal = !settings[key];
    setStoredBool(key, newVal);
    setSettings((prev) => ({ ...prev, [key]: newVal }));
  }

  return (
    <ModalShell
      title="Settings"
      titleId="settings-modal-title"
      onClose={handleClose}
      maxWidth="480px"
      bodyClassName="sm-body"
      footer={
        <ModalButton variant="danger" onClick={handleClose}>
          Close
        </ModalButton>
      }
    >
      {SETTINGS_KEYS.map(({ key, label }, i) => (
        <CheckboxField
          key={key}
          className="sm-row"
          id={`setting-${i}`}
          label={label}
          checked={settings[key]}
          onChange={() => toggle(key)}
        />
      ))}
    </ModalShell>
  );
}
