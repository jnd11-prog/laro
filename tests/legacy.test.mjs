import test from 'node:test';
import assert from 'node:assert/strict';
import {archetype, shirtNumber, derbyBetween, moments, verdict, roundNote} from '../lib/legacy.ts';
import {inspectCareer, advanceCareer} from '../lib/player-career.js';

const stats = (o) => ['pace', 'shooting', 'dribbling', 'passing', 'strength', 'defending'].map((key) => ({key, label: key, value: o[key] ?? 50}));
const player = (o) => ({overall: 80, retirementAge: 35, ...o, stats: stats(o.s || {})});

test('archetypes follow how fans describe a player', () => {
  assert.equal(archetype(player({position: 'CDM', s: {passing: 90}})), 'Regista');
  assert.equal(archetype(player({position: 'RW', foot: 'Left', s: {pace: 80}})), 'Inverted winger');
  assert.equal(archetype(player({position: 'LW', foot: 'Left', s: {pace: 90}})), 'Touchline winger');
  assert.equal(archetype(player({position: 'ST', height: `6'4"`, s: {strength: 88}})), 'Target man');
  assert.equal(archetype(player({position: 'ST', s: {passing: 85, dribbling: 80}})), 'False 9');
  assert.equal(archetype(player({position: 'GK', s: {passing: 85}})), 'Sweeper keeper');
  assert.equal(archetype(player({position: 'RM', foot: 'Right', s: {shooting: 85, dribbling: 50, pace: 60}})), 'Raumdeuter');
});

test('shirt numbers follow tradition, and the best attackers take the 10', () => {
  assert.equal(shirtNumber(player({position: 'GK'})), 1);
  assert.equal(shirtNumber(player({position: 'LB'})), 3);
  assert.equal(shirtNumber(player({position: 'CB', foot: 'Left'})), 5);
  assert.equal(shirtNumber(player({position: 'ST'})), 9);
  assert.equal(shirtNumber(player({position: 'ST', overall: 93})), 10);
});

test('derbies are recognized in either direction and across old club spellings', () => {
  assert.equal(derbyBetween('Barcelona', 'Real Madrid'), 'El Clásico');
  assert.equal(derbyBetween('Rangers', 'Celtic'), 'the Old Firm');
  assert.equal(derbyBetween('Atletico', 'Real Madrid'), 'the Madrid derby');
  assert.equal(derbyBetween('NY Red Bulls', 'NYCFC'), 'the Hudson River derby');
  assert.equal(derbyBetween('PSG', 'Lyon'), null);
});

test('career moments and the result note call out derby defections and homecomings', () => {
  const clubs = [{name: 'Tottenham', league: 'Premier League', years: 4, lt: 0, dc: 1}, {name: 'Arsenal', league: 'Premier League', years: 5, lt: 2, dc: 1}, {name: 'Tottenham', league: 'Premier League', years: 3, lt: 0, dc: 0, ret: true}, {name: 'LAFC', league: 'MLS', years: 2, lt: 1, dc: 0}];
  const p = player({position: 'ST', clubs});
  const lines = moments(p);
  assert.ok(lines.includes('Crossed the North London derby: Tottenham to Arsenal'), lines.join(' / '));
  assert.ok(lines.includes('Homecoming at Tottenham'));
  assert.ok(lines.includes('Final chapter in MLS'));
  assert.match(roundNote('tm1', p), /North London derby/);
  assert.equal(roundNote('lg1', p), null);
});

test('verdicts reflect the career', () => {
  assert.equal(verdict(player({ballonN: 1, wcWins: 1, clubs: []})), 'All-time great');
  assert.equal(verdict(player({clubs: [{name: 'Roma', years: 19}], seasons: 19})), 'One-club legend');
  assert.equal(verdict(player({clubs: Array.from({length: 8}, (_, i) => ({name: 'Club ' + i}))})), 'Journeyman');
  assert.equal(verdict(player({overall: 65, clubs: [{}, {}]})), 'Cult hero');
});

test('every simulated career gets a role, number and verdict', () => {
  for (let seed = 1; seed <= 120; seed++) {
    const choices = [];
    let f = inspectCareer(seed, choices);
    while (!f.complete) { choices.push(advanceCareer(seed, choices, () => ((seed * 37 + choices.length * 13) % 100) / 100).record); f = inspectCareer(seed, choices); }
    assert.ok(archetype(f.profile).length > 3);
    assert.ok(shirtNumber(f.profile) >= 1);
    assert.ok(verdict(f.profile).length > 3);
    assert.ok(Array.isArray(moments(f.profile)));
  }
});
