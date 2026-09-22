import {useEffect, useRef} from 'react';
import {Bookmark, ChevronRight, Search, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Concept} from './anatomy';
import {structureKey} from './study-list';

interface StudyPanelProps {
  structures: Concept[];
  storageAvailable: boolean;
  ready: boolean;
  onChoose: (concept: Concept) => void;
  onRemove: (concept: Concept) => void;
  onClose: () => void;
  onSearch: () => void;
}

export default function StudyPanel({structures, storageAvailable, ready, onChoose, onRemove, onClose, onSearch}: StudyPanelProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section id="study-panel" className="study-panel glass" aria-labelledby="study-title">
    <div className="panel-heading">
      <h2 id="study-title" ref={heading} tabIndex={-1}>Your study list <span className="small-number">{structures.length}</span></h2>
      <Button variant="ghost" className="icon-button" aria-label="Close study list" onClick={onClose}><X size={18}/></Button>
    </div>
    <p className="study-note">{storageAvailable ? 'Saved on this browser. Pick a structure to revisit it.' : 'Saved for this visit. Browser storage is unavailable.'}</p>
    {structures.length > 0 ? <ul className="study-structures">
      {structures.map(concept => <li key={structureKey(concept)}>
        <Button variant="ghost" className="study-choose" onClick={() => onChoose(concept)}>
          <span><strong>{concept.name}</strong><small>{concept.elements.length} {concept.elements.length === 1 ? 'piece' : 'pieces'}</small></span>
          <ChevronRight size={16}/>
        </Button>
        <Button variant="ghost" className="study-remove icon-button" aria-label={`Remove ${concept.name} from study list`} onClick={event => {
          // Move focus before the row disappears, including when removing the last item.
          const row = event.currentTarget.closest('li');
          const neighbor = row?.nextElementSibling ?? row?.previousElementSibling;
          if (neighbor) (neighbor.querySelector('.study-remove') as HTMLButtonElement|null)?.focus();
          else heading.current?.focus();
          onRemove(concept);
        }}><X size={16}/></Button>
      </li>)}
    </ul> : <div className="study-empty">
      <Bookmark size={25} strokeWidth={1.5}/>
      <strong>{ready ? 'Keep a few structures close.' : 'Preparing your study list…'}</strong>
      <p>{ready ? 'Select a structure, then save it from its detail card. Build a personal list to explore at your own pace.' : 'Your saved structures will appear when the anatomy catalogue is ready.'}</p>
      <Button variant="ghost" disabled={!ready} onClick={onSearch}><Search size={16}/>Find a structure</Button>
    </div>}
  </section>;
}
