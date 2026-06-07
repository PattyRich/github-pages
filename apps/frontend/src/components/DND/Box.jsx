import { useDrag } from 'react-dnd';
import Button from '../ui/Button';

const style = {
  border: '2px solid var(--osrs-border-dark)',
  backgroundColor: 'var(--osrs-bg-inventory)',
  color: 'var(--osrs-text-yellow)',
  textShadow: '1px 1px 0px black',
  boxShadow: 'inset 0 0 0 1px var(--osrs-border-light)',
  padding: '0.5rem 1rem',
  marginRight: '0.5rem',
  marginBottom: '0.5rem',
  cursor: 'move',
  display: 'flex',
  borderRadius: 'var(--osrs-radius)',
};
export const Box = function Box({ name, dropped, notPlaced }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'any',
    item: { name },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        dropped(item.name, dropResult.name);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));
  const opacity = isDragging ? 0.4 : 1;
  return (
    <span style={{ position: 'relative' }}>
      {!notPlaced && (
        <span
          onClick={() => dropped(name, 'jsadifoghdsal;kfgdjs;')}
          style={{
            color: 'red',
            cursor: 'pointer',
            fontSize: 10,
            position: 'absolute',
            right: '14px',
          }}
        >
          x
        </span>
      )}
      <div ref={drag} style={{ ...style, opacity }} data-testid={`box`}>
        {name}
      </div>
    </span>
  );
};
