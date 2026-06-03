import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const SETTINGS_KEYS = [
  { key: 'completeStyle',  label: 'Use alternative tile complete style?' },
  { key: 'showPoints',     label: 'Hide current points on bingo board?' },
  { key: 'showTeamPoints', label: 'Hide team points on team tabs?' },
  { key: 'showTitleTile',  label: 'Hide tile title on board?' },
  { key: 'showFeedback',   label: 'Hide feedback button?' },
];

export default function SettingsModal({ handleClose }) {
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(SETTINGS_KEYS.map(({ key }) => [key, localStorage.getItem(key) === 'true']))
  );

  function toggle(key) {
    const newVal = !settings[key];
    localStorage.setItem(key, newVal);
    setSettings(prev => ({ ...prev, [key]: newVal }));
  }

  return (
    <Modal show onHide={handleClose} size="lg" aria-labelledby="settings-modal-title" centered>
      <Modal.Header closeButton>
        <Modal.Title id="settings-modal-title">Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {SETTINGS_KEYS.map(({ key, label }, i) => (
          <div key={key} className="form-check" style={{ marginTop: '15px' }}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`setting-${i}`}
              checked={settings[key]}
              onChange={() => toggle(key)}
            />
            <label className="form-check-label" htmlFor={`setting-${i}`}>{label}</label>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
