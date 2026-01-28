export class Rules {
    constructor(game) {
        this.game = game;
    }

    createRulesAccordion() {
        const accordion = document.getElementById('rules-accordion');
        const rules = [
            {
                number: 1,
                title: "Vor Beginn des Spieles würfelt jede*r Spieler*in 1-mal.",
                content: "Der*die Spieler*in mit der höchsten Augenzahl eröffnet das Spiel."
            },
            {
                number: 2,
                title: "Jede*r Spieler*in darf 3-mal würfeln, solange sich keine seiner*ihrer Spielfiguren im Spielkreis befindet.",
                content: "Zum Spielkreis zählen auch die Zielfelder. Dies gilt nur, solange keine Figur im Spielkreis ist und dort noch vorrücken kann."
            },
            {
                number: 3,
                title: "Wird nach dreimaligem Würfeln keine 6 gewürfelt, ist der*die nächste Spieler*in an der Reihe."
            },
            {
                number: 4,
                title: "(Pflicht) Beim Würfeln einer 6 muss eine Figur aus den Eckkreisen auf das Startfeld gesetzt werden.",
                content: "Die Figur muss auf das Startfeld der eigenen Spielfarbe gesetzt werden. Ausnahme siehe Regel 10 „Schlagpflicht»."
            },
            {
                number: 5,
                title: "(Pflicht) Das Startfeld muss immer frei gemacht werden.",
                content: "Das Startfeld muss immer frei gemacht werden, solange sich eine Spielfigur auf einem der Eckkreisen befindet. Ausnahme siehe Regel 10 „Schlagpflicht». Wer dieser Pflicht nicht nachkommt, muss seine Spielfigur zurück auf seinen eigenen Eckkreis stellen und darf erst wieder nach würfeln einer 6 auf das Spielfeld zurück."
            },
            {
                number: 6,
                title: "Solange sich eine der eigenen Spielfiguren auf dem Spielfeld befindet, darf lediglich 1-mal gewürfelt werden.",
                content: "Dies gilt auch, wenn eine oder mehrere Figuren ihre Zielfelder erreicht haben, und dort noch vorrücken können. Wer mehrere Figuren auf dem Spielfeld hat, kann sich aussuchen, mit welcher Figur er weiterzieht."
            },
            {
                number: 7,
                title: "Wurde eine 6 gewürfelt muss der*die Spieler*in nochmals würfeln.",
                content: "Beim zweiten Wurf darf eine andere Figur benutzt werden. Ausnahme siehe Regel 4 und 5."
            },
            {
                number: 8,
                title: "(Pflicht) Jede gewürfelte Augenzahl muss sofort ausgeführt werden.",
                content: "Es besteht Zugpflicht. Ausnahme von der Zugpflicht besteht dann, wenn mit keiner der eigenen Figuren die entsprechende Zahl vorgerückt werden kann."
            },
            {
                number: 9,
                title: "Über die im Wege stehenden gegnerischen und eigenen Figuren wird gesprungen.",
                content: "Die übersprungen Felder werden mitgezählt. Ein Spielfeld darf jedoch auch nur von einer Figur besetzt werden."
            },
            {
                number: 10,
                title: "(Pflicht) Trifft eine Figur auf ein vom Gegner besetztes Feld, so muss die gegnerische Spielfigur geschlagen werden.",
                content: ">>>Schlagen ist oberste Pflicht<<< Die geschlagene Figur muss auf ihren eigenen Eckkreis zurückgesetzt werden und darf erst nach würfeln einer 6 wieder am Spiel teilnehmen. Gibt es mehrere Möglichkeiten zum Schlagen, kann der*die Spieler*Spielerin selbst eine davon auswählen (Beachte hierbei: doppelte Pflicht geht einfacher Pflicht vor – z.B. das eigene Startfeld ist von einer gegnerischen Figur besetzt = Pflicht 10 + 4 oder z.B. 10 + 5)."
            },
            {
                number: 11,
                title: "Wer seiner Pflicht zum Schlagen der gegnerischen Spielfigur nicht nachkommt, muss seine Spielfigur zurück auf seinen eigenen Eckkreis stellen.",
                content: "Die Figur darf erst wieder nach würfeln einer 6 auf das Spielfeld zurück."
            },
            {
                number: 12,
                title: "Es gilt der Grundsatz >>>Berührt = Geführt<<"
            },
            {
                number: 13,
                title: "Bei nicht Durchführen eines Pflicht-Zuges wird der letzte Zug ungültig.",
                content: "Dies gilt für die Pflicht-Züge gemäß Regel 4, 5, 8, 10 und 14. Die berührte Figur verbleibt auf dem bisherigen Feld und es geht mit dem*der nächsten Spieler*in weiter."
            },
            {
                number: 14,
                title: "(Pflicht) Hat eine Spielfigur eine Runde vollständig zurückgelegt, so muss Sie in die Zielfelder einrücken.",
                content: "Das „Einrücken» hat „Augengenau» zu erfolgen. Innerhalb der vier Zielfelder dürfen die eigenen Figuren nicht übersprungen werden."
            },
            {
                number: 15,
                title: "Das mutwillige Umwerfen von Spielfiguren führt zum sofortigen Spielausschluss!"
            },
            {
                number: 16,
                title: "Gewinner*in ist, wer als Erste*r alle seine Figuren auf seinen Zielfeldern platziert hat."
            }
        ];

        rules.forEach((rule) => {
            const item = document.createElement('div');
            item.className = 'rule-item';

            const contentHtml = rule.content ?
                `<p class="rule-text">${rule.content}</p>` :
                `<p class="rule-text">${rule.title.replace(/\(Pflicht\)|>>>|<<</g, '')}</p>`;

            let displayTitle = rule.title
                .replace(/\(Pflicht\)/g, '<span class="mandatory">(Pflicht)</span>')
                .replace(/>>>Schlagen ist oberste Pflicht<</g, '<span class="important">>>>Schlagen ist oberste Pflicht<<</span>')
                .replace(/>>>Berührt = Geführt<</g, '<span class="important">>>>Berührt = Geführt<<</span>');

            item.innerHTML = `
                <div class="rule-header" data-index="${rule.number}">
                    <span><span class="rule-number">${rule.number}</span> ${displayTitle}</span>
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </div>
                <div class="rule-content">
                    ${contentHtml}
                </div>
            `;
            accordion.appendChild(item);
        });

        // Event Listener für Regeln-Akkordeon
        const headers = document.querySelectorAll('.rule-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isActive = header.classList.contains('active');

                if (!isActive) {
                    header.classList.add('active');
                    content.classList.add('show');
                } else {
                    header.classList.remove('active');
                    content.classList.remove('show');
                }
            });
        });
    }
}