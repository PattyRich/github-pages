import Button from '../../components/ui/Button';
import Surface from '../../components/ui/Surface';
import type { RecentBoard } from '../../utils/utils';

export type RecentBoardItem = RecentBoard;

interface RecentBoardsProps {
  click: (item: RecentBoardItem) => void;
  recent?: RecentBoardItem[];
  removeRecent: (index: number) => void;
}

const RecentBoards = (props: RecentBoardsProps) => {
  return (
    <Surface className="recent-board-list" variant="glass">
      <h2 className="osrs-header">Recent Boards</h2>
      {props.recent &&
        props.recent.map((item, i) => {
          return (
            <Surface key={i} className="recent-board-row" variant="recessed">
              <div className="recent-board-meta">
                <strong>{item.boardName}</strong>
                <span>{item.privilege ?? item.priv}</span>
              </div>
              <div className="recent-board-actions">
                <Button variant="success" click={() => props.click(item)} text="Join" />
                <Button
                  variant="outline-danger"
                  click={() => props.removeRecent(i)}
                  text="Remove"
                />
              </div>
            </Surface>
          );
        })}
    </Surface>
  );
};

export default RecentBoards;
