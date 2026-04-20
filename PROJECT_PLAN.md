# Piano Progetto

## Obiettivo

Realizzare un'app di contabilita personale in Expo/React Native con dati locali su SQLite, pensata per uso mobile, in italiano e con valuta euro. La prima versione deve coprire tutte le aree richieste: conti divisi per tipologia, inserimento manuale delle transazioni, statistiche, gestione debiti/crediti e gestione abbonamenti.

## Ambito della Prima Release

- Dati salvati in locale su SQLite
- Nessun backend o sincronizzazione cloud in questa fase
- Solo lingua italiana
- Solo valuta euro
- Supporto a conti di tipologie diverse: contanti, carta, banca e altre varianti utili

## Architettura Consigliata

La base attuale del progetto e minima, quindi conviene costruire prima l'infrastruttura tecnica comune e poi i moduli funzionali. L'app dovra avere:

- bootstrap iniziale in App.tsx
- navigazione mobile chiara
- database SQLite con schema versionato
- modelli TypeScript condivisi
- servizi o repository separati dalla UI
- componenti riusabili per liste, card, form e stati vuoti

## Fasi di Implementazione

### 1. Fondazioni Applicative

- Aggiornare le dipendenze del progetto per navigazione, SQLite e componenti di supporto
- Trasformare App.tsx in root reale dell'app con provider e inizializzazione database
- Creare una struttura sorgente ordinata, ad esempio con cartelle per navigation, db, features, components, types, utils e theme

### 2. Persistenza e Modello Dati

- Configurare SQLite come storage locale principale
- Definire schema e migrazioni iniziali
- Creare tabelle per:
  - conti
  - transazioni
  - debiti e crediti
  - abbonamenti
- Definire tipi condivisi per i domini principali

### 3. Modulo Conti

- Creare schermata elenco conti
- Permettere creazione e modifica manuale dei conti
- Gestire tipologia conto, nome, saldo iniziale e saldo corrente
- Mostrare in modo chiaro i conti divisi per categoria, per esempio contanti, carta, banca e altri

### 4. Modulo Transazioni

- Permettere inserimento manuale delle transazioni sui conti
- Supportare entrate, uscite e trasferimenti tra conti
- Gestire campi come importo, data, descrizione, categoria, nota e conto associato
- Aggiungere lista movimenti con filtri minimi per periodo, tipo e conto
- Assicurare aggiornamento corretto dei saldi dopo ogni operazione

### 5. Modulo Statistiche

- Creare una schermata statistiche con riepiloghi per periodo
- Mostrare totale entrate, totale uscite e saldo netto
- Aggiungere breakdown per categoria o per conto
- Prevedere almeno viste su mese corrente, mese precedente e anno

### 6. Modulo Debiti e Crediti

- Gestire somme da pagare e somme da ricevere
- Salvare controparte, importo, scadenza, stato e note
- Permettere registrazione di pagamenti o incassi parziali
- Valutare collegamento opzionale con le transazioni reali del conto

### 7. Modulo Abbonamenti

- Gestire abbonamenti ricorrenti con nome, importo e frequenza
- Salvare prossima scadenza, stato attivo e conto associato
- Mostrare costo ricorrente totale mensile o annuale
- Permettere rinnovo e generazione guidata della relativa transazione

### 8. Qualita e Verifica

- Aggiungere validazioni dei form
- Uniformare formati data e valuta italiani
- Creare hook o helper riusabili per i calcoli
- Testare in particolare:
  - calcolo saldi
  - trasferimenti tra conti
  - aggregazioni statistiche
  - scadenze di debiti e abbonamenti

## Scelte di Prodotto

- I saldi dei conti dovrebbero derivare dalle transazioni piu il saldo iniziale, per evitare inconsistenze
- Debiti e crediti possono essere trattati come un unico dominio con due stati diversi
- Gli abbonamenti dovrebbero essere entita ricorrenti collegate facoltativamente alle transazioni
- La navigazione consigliata e con tab principali per Conti, Transazioni, Statistiche e una sezione Altro contenente Debiti/Crediti e Abbonamenti

## Ordine di Sviluppo Consigliato

1. Fondazioni tecniche
2. Database e modelli
3. Conti
4. Transazioni
5. Statistiche
6. Debiti e crediti
7. Abbonamenti
8. Rifinitura, test e ottimizzazione UX

## Stato Attuale

Il progetto e attualmente uno starter Expo minimale. Non sono ancora presenti:

- navigazione applicativa
- database locale
- struttura moduli
- schermate funzionali
- logica di persistenza

Questo file serve come memoria di progetto e riferimento operativo per le prossime implementazioni.