import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Screen =
  | 'home'
  | 'circle'
  | 'triangle'
  | 'pipe'
  | 'rod'
  | 'metal'
  | 'thickness'
  | 'condition'
  | 'metalDetail'
  | 'thicknessDetail'
  | 'conditionDetail'
  | 'saved'
  | 'project';



type SavedKind = 'circle' | 'triangle' | 'pipe' | 'rod' | 'metal' | 'thickness' | 'condition';

type SavedItem = {
  id: string;
  signature: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  payload: Record<string, string | number>;
  notes?: string;
};

type SavedProject = {
  id: string;
  name: string;
  itemIds: string[];
  notes?: string;
};

const SAVED_KEY = 'wbb_saved_items_v1';
const PROJECTS_KEY = 'wbb_saved_projects_v1';
const SAVED_NOTES_KEY = 'wbb_saved_notes_v1';
const SHARE_FUNCTION_URL =
  'https://dylsigpylgxumehseckr.supabase.co/functions/v1/share-setup';

const makeSavedItem = (
  kind: SavedKind,
  title: string,
  subtitle: string,
  payload: Record<string, string | number>
): SavedItem => {
  const signature = [kind, title, subtitle, JSON.stringify(payload)].join('|');
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    signature,
    kind,
    title,
    subtitle,
    payload,
  };
};

const BG = '#000000';
const PANEL = '#191b1c';
const PANEL_DARK = '#111314';
const PANEL_LIGHT = '#242627';
const TEXT = '#f4f1e9';
const MUTED = '#b9b9b3';
const BORDER = '#353839';
const YELLOW = '#f3c646';
const YELLOW_DARK = '#c99d22';
const BLACK = '#111111';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);


const standardPipeData = [
  { nps: '1/8', dn: '6', od: 0.405, walls: { '10': 0.049, '40': 0.068, '80': 0.095 } },
  { nps: '1/4', dn: '8', od: 0.540, walls: { '10': 0.065, '40': 0.088, '80': 0.119 } },
  { nps: '3/8', dn: '10', od: 0.675, walls: { '10': 0.065, '40': 0.091, '80': 0.126 } },
  { nps: '1/2', dn: '15', od: 0.840, walls: { '10': 0.083, '40': 0.109, '80': 0.147 } },
  { nps: '3/4', dn: '20', od: 1.050, walls: { '10': 0.083, '40': 0.113, '80': 0.154 } },
  { nps: '1', dn: '25', od: 1.315, walls: { '10': 0.109, '40': 0.133, '80': 0.179 } },
  { nps: '1 1/4', dn: '32', od: 1.660, walls: { '10': 0.109, '40': 0.140, '80': 0.191 } },
  { nps: '1 1/2', dn: '40', od: 1.900, walls: { '10': 0.109, '40': 0.145, '80': 0.200 } },
  { nps: '2', dn: '50', od: 2.375, walls: { '10': 0.109, '40': 0.154, '80': 0.218 } },
  { nps: '2 1/2', dn: '65', od: 2.875, walls: { '10': 0.120, '40': 0.203, '80': 0.276 } },
  { nps: '3', dn: '80', od: 3.500, walls: { '10': 0.120, '40': 0.216, '80': 0.300 } },
  { nps: '4', dn: '100', od: 4.500, walls: { '10': 0.120, '40': 0.237, '80': 0.337 } },
] as const;

const fallbackPipes = [
  ['1/8', '0.405', '0.269'],
  ['1/4', '0.540', '0.364'],
  ['3/8', '0.675', '0.493'],
  ['1/2', '0.840', '0.622'],
  ['3/4', '1.050', '0.824'],
  ['1', '1.315', '1.049'],
  ['1 1/4', '1.660', '1.380'],
  ['1 1/2', '1.900', '1.610'],
  ['2', '2.375', '2.067'],
  ['2 1/2', '2.875', '2.469'],
  ['3', '3.500', '3.068'],
  ['4', '4.500', '4.026'],
];

const wikiImage = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;

const APPROVED_METAL_SPRITE = require('./assets/reference/metal-approved.png');
const APPROVED_CONDITION_SPRITE = require('./assets/reference/condition-approved.jpg');
const APPROVED_THICKNESS = require('./assets/reference/thickness-approved.png');

function SpriteCrop({
  source,
  width,
  height,
  spriteHeight,
  y,
  style,
}: {
  source: any;
  width: number;
  height: number;
  spriteHeight: number;
  y: number;
  style?: any;
}) {
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      <Image
        source={source}
        style={{ position: 'absolute', left: 0, top: -y, width, height: spriteHeight }}
      />
    </View>
  );
}

const metals = [
  {
    name: 'Mild Steel',
    spriteY: 225,
    image: wikiImage('Mild steel sheet metal close up.jpg'),
    description: 'Low-carbon steel with a dull gray surface. One of the most common fabrication and structural welding materials.',
    welding: 'Commonly welded with SMAW, MIG, TIG, and flux-core processes.',
    note: 'Remove mill scale, oil, paint, and heavy rust where practical before welding.',
  },
  {
    name: 'Stainless Steel',
    spriteY: 270,
    image: wikiImage('Dark grey stainless steel heavily scratched worn seamless metal surface texture.jpg'),
    description: 'Corrosion-resistant steel containing chromium. Surface appearance can range from bright to brushed or matte.',
    welding: 'Use a filler compatible with the stainless grade and control heat input.',
    note: 'Keep stainless tools and abrasives separate from carbon-steel tools to reduce contamination.',
  },
  {
    name: 'Aluminum',
    spriteY: 0,
    image: wikiImage('Aluminiumblech.JPG'),
    description: 'Lightweight nonferrous metal with a silver-gray oxide layer that reforms quickly after cleaning.',
    welding: 'Typically welded with MIG or AC TIG using aluminum-compatible filler.',
    note: 'Remove oxide and contamination immediately before welding for best results.',
  },
  {
    name: 'Cast Iron',
    spriteY: 45,
    image: wikiImage('Grey textured cast finish clean rough seamless metal sheet surface texture.jpg'),
    description: 'High-carbon iron alloy commonly found in cast housings, machinery, cookware, and older components.',
    welding: 'Repair welding often uses nickel-based filler and controlled preheat/cooling procedures.',
    note: 'Identify the casting and repair requirements before welding; cracking risk can be significant.',
  },
  {
    name: 'Galvanized',
    spriteY: 180,
    image: wikiImage('Grey galvanized smooth clean steel metal sheet seamless surface texture.jpg'),
    description: 'Steel coated with zinc. Hot-dip galvanized surfaces often show a crystalline spangle pattern.',
    welding: 'The zinc coating should be removed from the weld area where practical.',
    note: 'Use effective ventilation/fume controls when welding galvanized material.',
  },
  {
    name: 'Chromoly',
    spriteY: 90,
    image: 'https://cdn.shopify.com/s/files/1/0610/7699/6235/files/Chromoly-Plates-Guage2.jpg?v=1761321484',
    description: 'Chromium-molybdenum alloy steel used for high-strength tubing, frames, motorsport parts, and fabrication.',
    welding: 'Filler and heat treatment depend on the exact alloy, thickness, and service requirement.',
    note: 'Do not assume every Cr-Mo alloy can use the same procedure; verify the material grade.',
  },
  {
    name: 'Copper',
    spriteY: 135,
    image: wikiImage('Copper sheet 100x.jpg'),
    description: 'Highly conductive nonferrous metal with a reddish-orange appearance when clean.',
    welding: 'High thermal conductivity usually requires more heat input than similarly sized steel.',
    note: 'Use a process and filler intended for the specific copper alloy.',
  },
  {
    name: 'Brass',
    spriteY: 0,
    image: wikiImage('Brass photoetch sheet.jpg'),
    description: 'Copper-zinc alloy used in fittings, hardware, decorative fabrication, and repair work.',
    welding: 'Often joined by TIG, brazing, or braze-welding depending on alloy and application.',
    note: 'Zinc can vaporize when heated. Use appropriate fume controls and verify the alloy before joining.',
  },
  {
    name: 'Bronze',
    spriteY: 0,
    image: wikiImage('Sculpture bronze texture.jpg'),
    description: 'Family of copper-based alloys commonly containing tin, silicon, aluminum, or other alloying elements.',
    welding: 'Joining method and filler depend on the exact bronze alloy; TIG and brazing processes are common.',
    note: 'Identify the bronze alloy before selecting filler or welding parameters.',
  },
  {
    name: 'Nickel Alloys',
    spriteY: 0,
    image: wikiImage('Nickel (Element - 28).jpg'),
    description: 'Nickel-based alloys are used where corrosion resistance, strength, or high-temperature performance is required.',
    welding: 'Commonly welded with GTAW, GMAW, or SMAW using filler matched to the specific nickel alloy.',
    note: 'Cleanliness and correct alloy identification are important; follow the applicable welding procedure.',
  },
  {
    name: 'Titanium',
    spriteY: 0,
    image: wikiImage('Titanium sheet from powder (9067742593).jpg'),
    description: 'Light, strong, corrosion-resistant metal used in aerospace, motorsport, chemical, and high-performance fabrication.',
    welding: 'Typically GTAW welded with very clean material and extensive inert-gas shielding.',
    note: 'Hot titanium reacts readily with air. Maintain shielding until the weld and heat-affected zone have cooled sufficiently.',
  },
  {
    name: 'Magnesium',
    spriteY: 0,
    image: wikiImage('CSIRO ScienceImage 937 Coiled magnesium sheets and magnesium ingots.jpg'),
    description: 'Very lightweight structural metal used in castings, transportation components, and specialty fabrication.',
    welding: 'Many magnesium alloys can be GTAW or GMAW welded with alloy-compatible filler and careful cleaning.',
    note: 'Magnesium chips, dust, and fine material present a serious fire hazard. Use procedures appropriate to the alloy and form.',
  },
  {
    name: 'Copper-Nickel',
    spriteY: 0,
    image: wikiImage('10 francs Turin en argent 1930 et cupronickel 1949.jpg'),
    description: 'Copper-nickel alloy valued for seawater corrosion resistance and widely used in marine piping and heat exchangers.',
    welding: 'Commonly GTAW or GMAW welded using filler selected for the specific Cu-Ni grade.',
    note: 'Keep the joint clean and verify the base alloy and service requirements before selecting filler.',
  },
] as const;

const thicknesses = [
  { label: '24 gauge', value: '0.024 in (0.6 mm)', inches: '0.024 in', mm: '0.6 mm', previewHeight: 3, note: 'Very thin sheet. Heat control is critical to reduce burn-through and distortion.' },
  { label: '20 gauge', value: '0.036 in (0.9 mm)', inches: '0.036 in', mm: '0.9 mm', previewHeight: 4, note: 'Thin sheet. Short welds, lower heat, and good fit-up help control distortion.' },
  { label: '18 gauge', value: '0.048 in (1.2 mm)', inches: '0.048 in', mm: '1.2 mm', previewHeight: 5, note: 'Common light-gauge sheet thickness used in fabrication and repair work.' },
  { label: '16 gauge', value: '0.060 in (1.5 mm)', inches: '0.060 in', mm: '1.5 mm', previewHeight: 6, note: 'Light sheet with a little more heat tolerance than 18- or 20-gauge material.' },
  { label: '14 gauge', value: '0.075 in (1.9 mm)', inches: '0.075 in', mm: '1.9 mm', previewHeight: 8, note: 'Medium sheet thickness used in brackets, panels, and general fabrication.' },
  { label: '11 gauge', value: '0.120 in (3.0 mm)', inches: '0.120 in', mm: '3.0 mm', previewHeight: 11, note: 'Near 1/8 inch plate thickness and suitable for many general fabrication jobs.' },
  { label: '1/8"', value: '0.125 in (3.2 mm)', inches: '0.125 in', mm: '3.2 mm', previewHeight: 12, note: 'Common light plate thickness. Joint type still determines required penetration and settings.' },
  { label: '1/4"', value: '0.250 in (6.4 mm)', inches: '0.250 in', mm: '6.4 mm', previewHeight: 21, note: 'Common plate thickness. Beveling or multiple passes may be required depending on the joint and process.' },
  { label: '3/8"', value: '0.375 in (9.5 mm)', inches: '0.375 in', mm: '9.5 mm', previewHeight: 30, note: 'Heavier plate that often requires joint preparation and multiple passes.' },
  { label: '1/2"', value: '0.500 in (12.7 mm)', inches: '0.500 in', mm: '12.7 mm', previewHeight: 40, note: 'Heavy plate. Procedure, preheat, joint design, and multiple passes become increasingly important.' },
] as const;

const conditions = [
  {
    name: 'Clean',
    spriteY: 0,
    desc: 'Bare metal, no rust or coating.',
    image: wikiImage('Metal steel surface.jpg'),
    prep: 'Remove oil, moisture, dirt, and loose scale. Bright clean metal gives the most predictable arc and weld quality.',
  },
  {
    name: 'Light Rust',
    spriteY: 162,
    desc: 'Surface rust, still solid.',
    image: wikiImage('Rusty metal sheet (Amal Kumar via Poly Haven).png'),
    prep: 'Wire-brush or grind the weld zone to remove loose oxidation. Confirm the base metal is still sound.',
  },
  {
    name: 'Moderate Rust',
    spriteY: 216,
    desc: 'Visible rust and scale.',
    image: wikiImage('Rust texture 3.jpg'),
    prep: 'Mechanically remove rust and scale around the joint. Recheck remaining thickness before welding.',
  },
  {
    name: 'Heavy Rust',
    spriteY: 108,
    desc: 'Thick rust, pitting, or material loss.',
    image: wikiImage('Rust texture.jpg'),
    prep: 'Do not weld over heavy corrosion. Clean to sound metal and verify that enough base material remains for a safe repair.',
  },
  {
    name: 'Painted',
    spriteY: 270,
    desc: 'Paint or coating over the base metal.',
    image: wikiImage('White painted slightly worn scratched chipped steel metal surface seamless texture.jpg'),
    prep: 'Remove paint from the weld zone and nearby heat-affected area. Unknown coatings can create hazardous fumes.',
  },
  {
    name: 'Galvanized',
    spriteY: 54,
    desc: 'Zinc-coated steel.',
    image: wikiImage('Galvanized surface.jpg'),
    prep: 'Remove zinc from the immediate weld zone where practical and use effective ventilation/fume controls.',
  },
] as const;

function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={TEXT} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function HomeButton({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
      <View style={styles.homeIconBox}>
        <Ionicons name={icon} size={44} color={iconColor} />
      </View>
      <View style={styles.homeButtonTextWrap}>
        <Text style={styles.homeButtonTitle}>{title}</Text>
        {subtitle ? <Text style={styles.homeButtonSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={26} color={TEXT} />
    </Pressable>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholderTextColor="#777"
        />
        {value ? (
          <Pressable onPress={() => setValue('')} hitSlop={10}>
            <Ionicons name="close" size={20} color={MUTED} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Segment({
  labels,
  active,
  onChange,
}: {
  labels: string[];
  active: number;
  onChange: (index: number) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      {labels.map((label, index) => (
        <Pressable
          key={label}
          onPress={() => onChange(index)}
          style={[
            styles.segmentButton,
            active === index && styles.segmentButtonActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              active === index && styles.segmentTextActive,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}


function SaveButton({
  saved,
  onPress,
  editing = false,
}: {
  saved: boolean;
  onPress: () => void;
  editing?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.saveButton,
        (saved || editing) && styles.saveButtonSaved,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={saved || editing ? 'checkmark-circle-outline' : 'bookmark-outline'}
        size={20}
        color={saved || editing ? BLACK : TEXT}
      />
      <Text style={[styles.saveButtonText, (saved || editing) && styles.saveButtonTextSaved]}>
        {editing ? 'UPDATE SAVED ITEM' : saved ? 'SAVED' : 'SAVE'}
      </Text>
    </Pressable>
  );
}

function SavedScreen({
  items,
  projects,
  savedNotes,
  onSavedNotesChange,
  onBack,
  onOpen,
  onShare,
  onDelete,
  onOpenProject,
  onNotesChange,
}: {
  items: SavedItem[];
  projects: SavedProject[];
  savedNotes: string;
  onSavedNotesChange: (notes: string) => void;
  onBack: () => void;
  onOpen: (item: SavedItem) => void;
  onShare: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onOpenProject: (project: SavedProject) => void;
  onNotesChange: (itemId: string, notes: string) => void;
}) {
  const groupedIds = new Set(projects.flatMap((project) => project.itemIds));
  const individualItems = items.filter((item) => !groupedIds.has(item.id));
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const payloadLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

  return (
    <>
      <Header title="SAVED" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.savedNotepadCard}>
          <View style={styles.projectNotesHeader}>
            <Ionicons name="document-text-outline" size={19} color={YELLOW} />
            <Text style={styles.projectNotesTitle}>NOTEPAD</Text>
          </View>
          <TextInput
            value={savedNotes}
            onChangeText={onSavedNotesChange}
            placeholder="Write a note..."
            placeholderTextColor="#777"
            style={styles.projectNotesInput}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.savedSectionTitle}>PROJECTS</Text>
        {projects.length === 0 ? (
          <Text style={styles.savedSectionEmpty}>No projects yet. Save an item and choose Add to project.</Text>
        ) : (
          projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => onOpenProject(project)}
              style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}
            >
              <View style={styles.projectIcon}>
                <Ionicons name="folder-outline" size={25} color={YELLOW} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectCount}>
                  {project.itemIds.length === 1 ? '1 item' : `${project.itemIds.length} items`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={TEXT} />
            </Pressable>
          ))
        )}

        <Text style={[styles.savedSectionTitle, { marginTop: 22 }]}>INDIVIDUAL ITEMS</Text>
        {individualItems.length === 0 ? (
          <Text style={styles.savedSectionEmpty}>No individual saved items.</Text>
        ) : (
          individualItems.map((item) => {
            const expanded = expandedIds.includes(item.id);
            return (
              <View key={item.id} style={styles.savedCard}>
                <Pressable onPress={() => toggleExpanded(item.id)} style={styles.savedCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedPartKind}>{item.kind.toUpperCase()}</Text>
                    <Text style={styles.savedCardTitle}>{item.title}</Text>
                    <Text style={styles.savedCardSub}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={TEXT} />
                </Pressable>

                {expanded ? (
                  <View style={styles.savedDropdown}>
                    {Object.entries(item.payload).map(([key, value]) => (
                      <View key={key} style={styles.savedDropdownRow}>
                        <Text style={styles.savedDropdownLabel}>{payloadLabel(key)}</Text>
                        <Text style={styles.savedDropdownValue}>{String(value)}</Text>
                      </View>
                    ))}
                    <Text style={styles.savedItemNoteLabel}>NOTES</Text>
                    <TextInput
                      value={item.notes ?? ''}
                      onChangeText={(notes) => onNotesChange(item.id, notes)}
                      placeholder="Write notes for this saved item..."
                      placeholderTextColor="#777"
                      style={styles.savedItemNotesInput}
                      multiline
                      textAlignVertical="top"
                    />
                    <View style={styles.savedActions}>
                      <Pressable onPress={() => onOpen(item)} style={styles.savedActionPrimary}>
                        <Text style={styles.savedActionPrimaryText}>EDIT</Text>
                      </Pressable>
                      <Pressable onPress={() => onShare(item)} style={styles.savedActionSecondary}>
                        <Ionicons name="share-outline" size={18} color={TEXT} />
                        <Text style={styles.savedActionSecondaryText}>SHARE</Text>
                      </Pressable>
                      <Pressable onPress={() => onDelete(item)} style={styles.savedDelete}>
                        <Ionicons name="trash-outline" size={20} color={MUTED} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

function ProjectScreen({
  project,
  items,
  onBack,
  onOpen,
  onShare,
  onDelete,
  onNotesChange,
}: {
  project: SavedProject;
  items: SavedItem[];
  onBack: () => void;
  onOpen: (item: SavedItem) => void;
  onShare: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onNotesChange: (projectId: string, notes: string) => void;
}) {
  const projectItems = project.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SavedItem => Boolean(item));
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const payloadLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (letter) => letter.toUpperCase());

  return (
    <>
      <Header title={project.name.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.projectDetailHeader}>
          <Ionicons name="folder-open-outline" size={30} color={YELLOW} />
          <View style={{ flex: 1 }}>
            <Text style={styles.projectDetailName}>{project.name}</Text>
            <Text style={styles.projectCount}>
              {projectItems.length === 1 ? '1 saved item' : `${projectItems.length} saved items`}
            </Text>
          </View>
        </View>
        <View style={styles.projectNotesCard}>
          <View style={styles.projectNotesHeader}>
            <Ionicons name="document-text-outline" size={19} color={YELLOW} />
            <Text style={styles.projectNotesTitle}>NOTES</Text>
          </View>
          <TextInput
            value={project.notes ?? ''}
            onChangeText={(notes) => onNotesChange(project.id, notes)}
            placeholder="Type notes here..."
            placeholderTextColor="#777"
            style={styles.projectNotesInput}
            multiline
            textAlignVertical="top"
          />
        </View>
        {projectItems.map((item) => {
          const expanded = expandedIds.includes(item.id);
          return (
            <View key={item.id} style={styles.savedCard}>
              <Pressable onPress={() => toggleExpanded(item.id)} style={styles.savedCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedPartKind}>{item.kind.toUpperCase()}</Text>
                  <Text style={styles.savedCardTitle}>{item.title}</Text>
                  <Text style={styles.savedCardSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={TEXT} />
              </Pressable>

              {expanded ? (
                <View style={styles.savedDropdown}>
                  {Object.entries(item.payload).map(([key, value]) => (
                    <View key={key} style={styles.savedDropdownRow}>
                      <Text style={styles.savedDropdownLabel}>{payloadLabel(key)}</Text>
                      <Text style={styles.savedDropdownValue}>{String(value)}</Text>
                    </View>
                  ))}
                  {item.notes ? (
                    <View style={styles.savedDropdownRow}>
                      <Text style={styles.savedDropdownLabel}>Notes</Text>
                      <Text style={styles.savedDropdownValue}>{item.notes}</Text>
                    </View>
                  ) : null}
                  <View style={styles.savedActions}>
                    <Pressable onPress={() => onOpen(item)} style={styles.savedActionPrimary}>
                      <Text style={styles.savedActionPrimaryText}>OPEN</Text>
                    </Pressable>
                    <Pressable onPress={() => onShare(item)} style={styles.savedActionSecondary}>
                      <Ionicons name="share-outline" size={18} color={TEXT} />
                      <Text style={styles.savedActionSecondaryText}>SHARE</Text>
                    </Pressable>
                    <Pressable onPress={() => onDelete(item)} style={styles.savedDelete}>
                      <Ionicons name="trash-outline" size={20} color={MUTED} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

function SaveToProjectModal({
  visible,
  item,
  projects,
  onClose,
  onSaveIndividual,
  onAddExisting,
  onCreateProject,
}: {
  visible: boolean;
  item: SavedItem | null;
  projects: SavedProject[];
  onClose: () => void;
  onSaveIndividual: (item: SavedItem) => void;
  onAddExisting: (item: SavedItem, projectId: string) => void;
  onCreateProject: (item: SavedItem, name: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!visible) {
      setCreating(false);
      setProjectName('');
    }
  }, [visible]);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.saveModalBackdrop} onPress={onClose}>
        <Pressable style={styles.saveModalCard} onPress={() => {}}>
          <Text style={styles.saveModalTitle}>Save item</Text>
          <Text style={styles.saveModalItem}>{item.title}</Text>

          <Pressable onPress={() => onSaveIndividual(item)} style={styles.saveModalPrimary}>
            <Ionicons name="bookmark-outline" size={20} color={BLACK} />
            <Text style={styles.saveModalPrimaryText}>SAVE BY ITSELF</Text>
          </Pressable>

          <Text style={styles.saveModalLabel}>ADD TO PROJECT</Text>
          {projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => onAddExisting(item, project.id)}
              style={styles.saveModalProject}
            >
              <Ionicons name="folder-outline" size={20} color={YELLOW} />
              <Text style={styles.saveModalProjectText}>{project.name}</Text>
              <Ionicons name="chevron-forward" size={19} color={MUTED} />
            </Pressable>
          ))}

          {!creating ? (
            <Pressable onPress={() => setCreating(true)} style={styles.saveModalNewProject}>
              <Ionicons name="add" size={21} color={TEXT} />
              <Text style={styles.saveModalNewProjectText}>NEW PROJECT</Text>
            </Pressable>
          ) : (
            <View style={styles.newProjectBox}>
              <Text style={styles.saveModalLabel}>PROJECT NAME</Text>
              <TextInput
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Leave blank for Untitled"
                placeholderTextColor="#777"
                style={styles.projectNameInput}
                autoFocus
                returnKeyType="done"
              />
              <Pressable
                onPress={() => onCreateProject(item, projectName.trim())}
                style={styles.saveModalPrimary}
              >
                <Text style={styles.saveModalPrimaryText}>CREATE PROJECT & SAVE</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={onClose} style={styles.saveModalCancel}>
            <Text style={styles.saveModalCancelText}>CANCEL</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CircleScreen({
  onBack,
  initial,
  isSaved,
  onToggleSave,
}: {
  onBack: () => void;
  initial?: SavedItem | null;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const [mode, setMode] = useState(
    initial?.kind === 'circle' ? Number(initial.payload.mode ?? 0) : 0
  );
  const [value, setValue] = useState(
    initial?.kind === 'circle' ? String(initial.payload.input ?? '4') : '4'
  );
  const result = useMemo(() => {
    const n = parseFloat(value);
    if (!isFinite(n)) return '';
    return mode === 0 ? (Math.PI * n).toFixed(2) : (n / Math.PI).toFixed(2);
  }, [mode, value]);

  const savedItem = makeSavedItem(
    'circle',
    mode === 0 ? `Circle • Ø ${value || '—'} in` : `Circle • C ${value || '—'} in`,
    result
      ? mode === 0
        ? `Circumference ${result} in`
        : `Diameter ${result} in`
      : 'Circle measurement',
    { mode, input: value, result }
  );

  return (
    <>
      <Header title="CIRCLE CALCULATOR" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.circleTop}>
          <View style={styles.circleDrawing}>
            <View style={styles.circleLine} />
            <Text style={styles.circleD}>D</Text>
          </View>
          <Text style={styles.formulaText}>C = π × D{"\n"}C = π × 2r{"\n"}π = 3.1416</Text>
        </View>

        <Segment
          labels={['Diameter → Circumference', 'Circumference → Diameter']}
          active={mode}
          onChange={setMode}
        />

        <Field
          label={mode === 0 ? 'Diameter (in)' : 'Circumference (in)'}
          value={value}
          setValue={setValue}
        />

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            {mode === 0 ? 'Circumference' : 'Diameter'}
          </Text>
          <Text style={styles.resultBig}>
            {result || '—'} <Text style={styles.resultUnit}>in</Text>
          </Text>
        </View>

        <SaveButton
          saved={isSaved(savedItem)}
          editing={Boolean(initial)}
          onPress={() => onToggleSave(savedItem)}
        />

        <Pressable onPress={() => setValue('')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function TriangleScreen({
  onBack,
  initial,
  isSaved,
  onToggleSave,
}: {
  onBack: () => void;
  initial?: SavedItem | null;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const [mode, setMode] = useState(0);
  const [a, setA] = useState(
    initial?.kind === 'triangle' ? String(initial.payload.a ?? '3') : '3'
  );
  const [b, setB] = useState(
    initial?.kind === 'triangle' ? String(initial.payload.b ?? '4') : '4'
  );

  const c = useMemo(() => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    return isFinite(x) && isFinite(y) ? Math.sqrt(x * x + y * y).toFixed(2) : '';
  }, [a, b]);

  const savedItem = makeSavedItem(
    'triangle',
    `Triangle • ${a || '—'} × ${b || '—'} in`,
    c ? `Hypotenuse ${c} in` : 'Triangle measurement',
    { a, b, c }
  );

  return (
    <>
      <Header title="TRIANGLE CALCULATOR" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.triangleTop}>
          <View style={styles.triangleOutline} />
          <Text style={[styles.triangleLabel, { left: 18, top: 72 }]}>a</Text>
          <Text style={[styles.triangleLabel, { left: 102, top: 136 }]}>b</Text>
          <Text style={[styles.triangleLabel, { left: 117, top: 50 }]}>c</Text>
          <Text style={styles.triangleFormula}>c² = a² + b²</Text>
        </View>

        <Segment
          labels={['Find Hypotenuse (c)', 'Find a or b']}
          active={mode}
          onChange={setMode}
        />

        <Field label="Side a (in)" value={a} setValue={setA} />
        <Field label="Side b (in)" value={b} setValue={setB} />

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Hypotenuse (c)</Text>
          <Text style={styles.resultBig}>
            {c || '—'} <Text style={styles.resultUnit}>in</Text>
          </Text>
        </View>

        <SaveButton
          saved={isSaved(savedItem)}
          editing={Boolean(initial)}
          onPress={() => onToggleSave(savedItem)}
        />

        <Pressable
          onPress={() => {
            setA('');
            setB('');
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function PipeScreen({
  onBack,
  initial,
  isSaved,
  onToggleSave,
}: {
  onBack: () => void;
  initial?: SavedItem | null;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const initialMode = String(initial?.payload.mode ?? 'standard');
  const [tab, setTab] = useState(initialMode === 'custom' ? 1 : initialMode === 'slip' ? 2 : 0);
  const [nps, setNps] = useState(String(initial?.payload.nps ?? '2'));
  const [schedule, setSchedule] = useState(String(initial?.payload.schedule ?? '40'));
  const [tubeOd, setTubeOd] = useState(String(initial?.payload.od ?? '1.000'));
  const [tubeWall, setTubeWall] = useState(String(initial?.payload.wall ?? '0.065'));
  const [slipOd, setSlipOd] = useState(String(initial?.payload.od ?? '2.375'));
  const [clearance, setClearance] = useState(String(initial?.payload.clearance ?? '0.020'));

  const standard = standardPipeData.find((pipe) => pipe.nps === nps) ?? standardPipeData[8];
  const wall = standard.walls[schedule as keyof typeof standard.walls];
  const standardId = (standard.od - (2 * wall)).toFixed(3);

  const customOdNumber = Number(tubeOd);
  const customWallNumber = Number(tubeWall);
  const customId =
    Number.isFinite(customOdNumber) && Number.isFinite(customWallNumber) && customOdNumber > 2 * customWallNumber
      ? (customOdNumber - (2 * customWallNumber)).toFixed(3)
      : '';

  const slipOdNumber = Number(slipOd);
  const clearanceNumber = Number(clearance);
  const slipOverId =
    Number.isFinite(slipOdNumber) && Number.isFinite(clearanceNumber)
      ? (slipOdNumber + clearanceNumber).toFixed(3)
      : '';

  const savedItem = tab === 0
    ? makeSavedItem(
        'pipe',
        `NPS ${nps}" · Sch ${schedule}`,
        `OD ${standard.od.toFixed(3)}" · Wall ${wall.toFixed(3)}" · ID ${standardId}"`,
        { mode: 'standard', nps, dn: standard.dn, schedule, od: standard.od.toFixed(3), wall: wall.toFixed(3), id: standardId }
      )
    : tab === 1
      ? makeSavedItem(
          'pipe',
          'Custom / Tube',
          `OD ${tubeOd}" · Wall ${tubeWall}" · ID ${customId || '—'}"`,
          { mode: 'custom', od: tubeOd, wall: tubeWall, id: customId }
        )
      : makeSavedItem(
          'pipe',
          'Slip Fit',
          `OD ${slipOd}" · Slip-over ID ${slipOverId || '—'}" · Clearance ${clearance}"`,
          { mode: 'slip', od: slipOd, slipOverId, clearance }
        );

  return (
    <>
      <Header title="PIPE SIZES" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Segment labels={['PIPE', 'TUBE / CUSTOM', 'SLIP FIT']} active={tab} onChange={setTab} />

        {tab === 0 ? (
          <>
            <Text style={styles.pipeReferenceNote}>SELECT PIPE SIZE</Text>
            <SelectorRow label="NPS / NB" value={nps} options={standardPipeData.map((pipe) => pipe.nps)} onChange={setNps} />
            <SelectorRow label="SCHEDULE" value={schedule} options={['10', '40', '80']} onChange={setSchedule} />
            <View style={styles.infoCard}>
              <InfoLine label="DN" value={`DN ${standard.dn}`} />
              <InfoLine label="Outside Diameter" value={`${standard.od.toFixed(3)} in`} />
              <InfoLine label="Wall Thickness" value={`${wall.toFixed(3)} in`} />
              <InfoLine label="Inside Diameter" value={`${standardId} in`} />
            </View>
          </>
        ) : tab === 1 ? (
          <>
            <Text style={styles.pipeReferenceNote}>ENTER ACTUAL TUBE DIMENSIONS</Text>
            <Text style={styles.selectorLabel}>OUTSIDE DIAMETER (IN)</Text>
            <TextInput value={tubeOd} onChangeText={setTubeOd} keyboardType="decimal-pad" style={styles.input} selectTextOnFocus />
            <Text style={styles.selectorLabel}>WALL THICKNESS (IN)</Text>
            <TextInput value={tubeWall} onChangeText={setTubeWall} keyboardType="decimal-pad" style={styles.input} selectTextOnFocus />
            <View style={styles.infoCard}>
              <InfoLine label="Calculated ID" value={customId ? `${customId} in` : 'Enter valid OD and wall'} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.pipeReferenceNote}>SLIP FIT CALCULATOR</Text>
            <Text style={styles.selectorLabel}>INNER PIECE OD (IN)</Text>
            <TextInput value={slipOd} onChangeText={setSlipOd} keyboardType="decimal-pad" style={styles.input} selectTextOnFocus />
            <Text style={styles.selectorLabel}>DIAMETRAL CLEARANCE (IN)</Text>
            <TextInput value={clearance} onChangeText={setClearance} keyboardType="decimal-pad" style={styles.input} selectTextOnFocus />
            <View style={styles.infoCard}>
              <InfoLine label="Required Slip-over ID" value={slipOverId ? `${slipOverId} in` : 'Enter valid dimensions'} />
            </View>
          </>
        )}

        <SaveButton saved={isSaved(savedItem)} editing={Boolean(initial)} onPress={() => onToggleSave(savedItem)} />
      </ScrollView>
    </>
  );
}

function SelectorRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.selectorBlock}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.selectorField, pressed && styles.pressed]}
      >
        <Text style={styles.selectorValue}>{value}</Text>
        <Ionicons name="chevron-down" size={20} color={TEXT} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectorModalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.selectorModalCard}>
            <Text style={styles.selectorModalTitle}>{label}</Text>
            <ScrollView style={styles.selectorModalList}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.selectorOption,
                    option === value && styles.selectorOptionActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorOptionText,
                      option === value && styles.selectorOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {option === value ? <Ionicons name="checkmark" size={22} color={BLACK} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const rodMetals = ['Mild Steel', 'Stainless Steel', 'Aluminum', 'Cast Iron', 'Galvanized', 'Chromoly', 'Copper', 'Brass', 'Bronze', 'Nickel Alloys', 'Titanium', 'Magnesium', 'Copper-Nickel'] as const;
const rodThicknesses = ['1/8" (3 mm)', '3/16" (5 mm)', '1/4" (6 mm)', '3/8" (10 mm)', '1/2" (13 mm)'] as const;
const rodConditions = ['Clean', 'Light Rust', 'Moderate Rust', 'Heavy Rust'] as const;

function RodScreen({
  onBack,
  isSaved,
  onToggleSave,
}: {
  onBack: () => void;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const [metal, setMetal] = useState<string>('Mild Steel');
  const [thickness, setThickness] = useState<string>('1/4" (6 mm)');
  const [condition, setCondition] = useState<string>('Clean');

  const recommendation = useMemo(() => {
    const rodByThickness: Record<string, { rod: string; amps: string }> = {
      '1/8" (3 mm)': { rod: '2.4 mm', amps: '55–90 A' },
      '3/16" (5 mm)': { rod: '3.2 mm', amps: '75–115 A' },
      '1/4" (6 mm)': { rod: '3.2 mm', amps: '90–130 A' },
      '3/8" (10 mm)': { rod: '4.0 mm', amps: '120–180 A' },
      '1/2" (13 mm)': { rod: '4.0 mm', amps: '130–190 A' },
    };
    const size = rodByThickness[thickness] ?? rodByThickness['1/4" (6 mm)'];

    if (metal === 'Stainless Steel') {
      return {
        ...size,
        imperial: size.rod === '2.4 mm' ? '(3/32")' : size.rod === '3.2 mm' ? '(1/8")' : '(5/32")',
        types: 'E308L-16',
        polarity: 'DCEP or AC',
        notes: 'Common choice for 304/304L stainless. Verify the base-metal grade before selecting filler.',
      };
    }

    if (metal === 'Cast Iron') {
      return {
        ...size,
        imperial: size.rod === '2.4 mm' ? '(3/32")' : size.rod === '3.2 mm' ? '(1/8")' : '(5/32")',
        types: 'ENi-CI / ENiFe-CI',
        polarity: 'Per electrode spec',
        notes: 'Cast-iron repairs depend on the casting and procedure. Preheat and controlled cooling may be required.',
      };
    }

    const specialMetals: Record<string, { types: string; polarity: string; notes: string }> = {
      Galvanized: {
        types: 'E6011 / E7018',
        polarity: 'AC or DCEP',
        notes: 'Galvanized steel is zinc-coated carbon steel. Remove zinc from the weld area where practical and use effective fume extraction or ventilation.',
      },
      Chromoly: {
        types: 'E8018-B2 / alloy-specific',
        polarity: 'DCEP',
        notes: 'Chromoly filler and heat treatment depend on the exact Cr-Mo grade, thickness, and service requirement. Verify the material grade and welding procedure before welding.',
      },
      Copper: {
        types: 'ECu / copper-alloy specific',
        polarity: 'Per electrode spec',
        notes: 'Copper conducts heat very quickly and often requires substantial preheat and heat input. Use filler matched to the specific copper grade or alloy.',
      },
      Brass: {
        types: 'Cu-Si / Cu-Sn filler',
        polarity: 'Process dependent',
        notes: 'Brass is a copper-zinc alloy and is commonly brazed or TIG braze-welded rather than stick welded. Zinc fumes are hazardous; identify the alloy and use effective fume control.',
      },
      Bronze: {
        types: 'ECuSn / ECuAl / alloy-specific',
        polarity: 'Per electrode spec',
        notes: 'Bronze covers several copper alloys, so filler depends on the exact bronze composition. Identify the alloy before selecting a rod or welding procedure.',
      },
      'Nickel Alloys': {
        types: 'ENiCrFe / ENiCrMo / alloy-specific',
        polarity: 'DCEP',
        notes: 'Nickel alloys require filler matched to the specific base alloy and service conditions. Keep the joint very clean and follow the applicable welding procedure.',
      },
      Titanium: {
        types: 'GTAW preferred / titanium filler',
        polarity: 'DCEN for GTAW',
        notes: 'Titanium is generally GTAW welded rather than stick welded. The weld and hot heat-affected zone require high-purity inert-gas shielding until sufficiently cool.',
      },
      Magnesium: {
        types: 'GTAW/GMAW preferred',
        polarity: 'Process dependent',
        notes: 'Magnesium is generally GTAW or GMAW welded with alloy-compatible filler rather than stick welded. Clean thoroughly and use procedures appropriate to the exact alloy.',
      },
      'Copper-Nickel': {
        types: 'CuNi filler / alloy-specific',
        polarity: 'Process dependent',
        notes: 'Copper-nickel is commonly GTAW or GMAW welded with filler matched to the Cu-Ni grade. Keep the joint clean and verify the alloy and service requirements.',
      },
    };

    if (specialMetals[metal]) {
      const special = specialMetals[metal];
      return {
        ...size,
        imperial: size.rod === '2.4 mm' ? '(3/32")' : size.rod === '3.2 mm' ? '(1/8")' : '(5/32")',
        ...special,
      };
    }

    const dirty = condition !== 'Clean';
    return {
      ...size,
      imperial: size.rod === '2.4 mm' ? '(3/32")' : size.rod === '3.2 mm' ? '(1/8")' : '(5/32")',
      types: dirty ? 'E6011' : 'E6011, E7018',
      polarity: dirty ? 'AC or DCEP' : 'AC or DCEP',
      notes:
        condition === 'Heavy Rust'
          ? 'Clean to sound metal before welding. Heavy corrosion can mean unsafe material loss.'
          : dirty
            ? 'E6011 tolerates contamination better, but remove rust and scale where practical.'
            : 'Good all-purpose setup for clean mild steel. E7018 is commonly used where a low-hydrogen electrode is required.',
    };
  }, [metal, thickness, condition]);

  const savedItem = makeSavedItem(
    'rod',
    `${metal} • ${thickness}`,
    `${recommendation.types} • ${recommendation.amps}`,
    {
      metal,
      thickness,
      condition,
      rod: `${recommendation.rod} ${recommendation.imperial}`,
      types: recommendation.types,
      polarity: recommendation.polarity,
      amperage: recommendation.amps,
    }
  );

  return (
    <>
      <Header title="WELDING ROD SELECTOR" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <SelectorRow label="Metal" value={metal} options={rodMetals} onChange={setMetal} />
        <SelectorRow label="Thickness" value={thickness} options={rodThicknesses} onChange={setThickness} />
        <SelectorRow label="Condition" value={condition} options={rodConditions} onChange={setCondition} />

        <View style={styles.recommendedCard}>
          <Text style={styles.recommendedLabel}>Recommended Rod</Text>
          <Text style={styles.recommendedBig}>{recommendation.rod}</Text>
          <Text style={styles.recommendedSub}>{recommendation.imperial}</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoLine label="Common Types" value={recommendation.types} />
          <InfoLine label="Polarity" value={recommendation.polarity} />
          <InfoLine label="Amperage" value={recommendation.amps} />
          <InfoLine label="Notes" value={recommendation.notes} multiline />
        </View>
        <SaveButton
          saved={isSaved(savedItem)}
          editing={Boolean(initial)}
          onPress={() => onToggleSave(savedItem)}
        />
      </ScrollView>
    </>
  );
}

function InfoLine({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.infoLine, multiline && { alignItems: 'flex-start' }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MetalScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <Header title="METAL REFERENCE" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {metals.map((metal, index) => (
          <Pressable
            key={metal.name}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [styles.referenceRow, pressed && styles.pressed]}
          >
            {['Aluminum', 'Cast Iron', 'Brass', 'Bronze', 'Nickel Alloys', 'Titanium', 'Magnesium', 'Copper-Nickel'].includes(metal.name) ? (
              <Image source={{ uri: metal.image }} style={styles.referencePhoto} resizeMode="cover" />
            ) : (
              <SpriteCrop
                source={APPROVED_METAL_SPRITE}
                width={62}
                height={45}
                spriteHeight={315}
                y={metal.spriteY}
                style={styles.referencePhoto}
              />
            )}
            <Text style={styles.referenceTitle}>{metal.name}</Text>
            <Ionicons name="chevron-forward" size={22} color={TEXT} />
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function ThicknessScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <Header title="THICKNESS REFERENCE" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {thicknesses.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [styles.referenceRow, pressed && styles.pressed]}
          >
            <Image
              source={APPROVED_THICKNESS}
              style={styles.thicknessReferenceImage}
              resizeMode="stretch"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.referenceTitle}>{item.label}</Text>
              <Text style={styles.referenceSub}>{item.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEXT} />
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function ConditionScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <Header title="RUST / CONDITION" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {conditions.map((condition, index) => (
          <Pressable
            key={condition.name}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [styles.conditionRow, pressed && styles.pressed]}
          >
            <Image source={{ uri: condition.image }} style={styles.conditionPhoto} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.referenceTitle}>{condition.name}</Text>
              <Text style={styles.referenceSub}>{condition.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={TEXT} />
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function MetalDetailScreen({
  index,
  onBack,
  isSaved,
  onToggleSave,
}: {
  index: number;
  onBack: () => void;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const metal = metals[index];
  const savedItem = makeSavedItem(
    'metal',
    metal.name,
    'Metal reference',
    { index, metal: metal.name }
  );
  return (
    <>
      <Header title={metal.name.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: metal.image }} style={styles.detailPhoto} resizeMode="cover" />
        <Text style={styles.detailTitle}>{metal.name}</Text>
        <Text style={styles.detailBody}>{metal.description}</Text>
        <View style={styles.infoCard}>
          <InfoLine label="Welding" value={metal.welding} multiline />
          <InfoLine label="Prep / Notes" value={metal.note} multiline />
        </View>
        <SaveButton
          saved={isSaved(savedItem)}
          onPress={() => onToggleSave(savedItem)}
        />
        <Text style={styles.photoSource}>Reference photo: Wikimedia Commons</Text>
      </ScrollView>
    </>
  );
}

function ThicknessDetailScreen({
  index,
  onBack,
  isSaved,
  onToggleSave,
}: {
  index: number;
  onBack: () => void;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const item = thicknesses[index];
  const savedItem = makeSavedItem(
    'thickness',
    item.label,
    item.value,
    { index, thickness: item.label, decimal: item.inches, metric: item.mm }
  );
  return (
    <>
      <Header title={item.label.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.thicknessDetailCard}>
          <Text style={styles.thicknessDetailLabel}>{item.label}</Text>
          <View style={styles.thicknessHeroFrame}>
            <View
              style={[
                styles.thicknessHeroBar,
                { height: Math.max(8, item.previewHeight * 2) },
              ]}
            />
          </View>
          <Text style={styles.thicknessDetailValue}>{item.inches}</Text>
          <Text style={styles.thicknessDetailMetric}>{item.mm}</Text>
          <Text style={styles.thicknessScaleNote}>Visual thickness comparison</Text>
        </View>
        <View style={styles.infoCard}>
          <InfoLine label="Nominal" value={item.label} />
          <InfoLine label="Decimal" value={item.inches} />
          <InfoLine label="Metric" value={item.mm} />
          <InfoLine label="Welding note" value={item.note} multiline />
        </View>
        <SaveButton
          saved={isSaved(savedItem)}
          onPress={() => onToggleSave(savedItem)}
        />
      </ScrollView>
    </>
  );
}

function ConditionDetailScreen({
  index,
  onBack,
  isSaved,
  onToggleSave,
}: {
  index: number;
  onBack: () => void;
  isSaved: (item: SavedItem) => boolean;
  onToggleSave: (item: SavedItem) => void;
}) {
  const condition = conditions[index];
  const savedItem = makeSavedItem(
    'condition',
    condition.name,
    condition.desc,
    { index, condition: condition.name }
  );
  return (
    <>
      <Header title={condition.name.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: condition.image }} style={styles.detailPhoto} resizeMode="cover" />
        <Text style={styles.detailTitle}>{condition.name}</Text>
        <Text style={styles.detailBody}>{condition.desc}</Text>
        <View style={styles.infoCard}>
          <InfoLine label="Prep / Notes" value={condition.prep} multiline />
        </View>
        <SaveButton
          saved={isSaved(savedItem)}
          onPress={() => onToggleSave(savedItem)}
        />
        <Text style={styles.photoSource}>Reference photo: Wikimedia Commons</Text>
      </ScrollView>
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMetal, setSelectedMetal] = useState(0);
  const [selectedThickness, setSelectedThickness] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState(0);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [openedSaved, setOpenedSaved] = useState<SavedItem | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<SavedItem | null>(null);
  const [savedNotes, setSavedNotes] = useState('');
  const [savedNotesLoaded, setSavedNotesLoaded] = useState(false);
  const goHome = () => {
    setOpenedSaved(null);
    setScreen('home');
  };
  const backFromOpenedSaved = () => {
    if (openedSaved) {
      setOpenedSaved(null);
      setScreen('saved');
    } else {
      goHome();
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setSavedItems(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setSavedLoaded(true));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PROJECTS_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setProjects(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setProjectsLoaded(true));
  }, []);

  useEffect(() => {
    if (!projectsLoaded) return;
    AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)).catch(() => {});
  }, [projects, projectsLoaded]);

  useEffect(() => {
    if (!savedLoaded) return;
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(savedItems)).catch(() => {});
  }, [savedItems, savedLoaded]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_NOTES_KEY)
      .then((raw) => {
        if (raw !== null) setSavedNotes(raw);
      })
      .catch(() => {})
      .finally(() => setSavedNotesLoaded(true));
  }, []);

  useEffect(() => {
    if (!savedNotesLoaded) return;
    AsyncStorage.setItem(SAVED_NOTES_KEY, savedNotes).catch(() => {});
  }, [savedNotes, savedNotesLoaded]);

  const isSaved = (item: SavedItem) => {
    const groupedIds = new Set(projects.flatMap((project) => project.itemIds));
    return savedItems.some(
      (saved) => saved.signature === item.signature && !groupedIds.has(saved.id)
    );
  };

  const freshSaveCopy = (item: SavedItem): SavedItem => ({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });

  const toggleSave = (item: SavedItem) => {
    if (openedSaved) {
      const updated: SavedItem = {
        ...item,
        id: openedSaved.id,
        notes: openedSaved.notes,
      };
      setSavedItems((current) =>
        current.map((saved) => saved.id === openedSaved.id ? updated : saved)
      );
      setOpenedSaved(updated);
      return;
    }
    setPendingSave(freshSaveCopy(item));
  };

  const saveIndividual = (item: SavedItem) => {
    const copy = freshSaveCopy(item);
    setSavedItems((current) => [copy, ...current]);
    setPendingSave(null);
  };

  const addToExistingProject = (item: SavedItem, projectId: string) => {
    const copy = freshSaveCopy(item);
    setSavedItems((current) => [copy, ...current]);
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, itemIds: [...project.itemIds, copy.id] }
          : project
      )
    );
    setPendingSave(null);
  };

  const createProjectAndSave = (item: SavedItem, requestedName: string) => {
    const usedUntitled = projects
      .map((project) => /^Untitled (\d+)$/.exec(project.name))
      .filter((match): match is RegExpExecArray => Boolean(match))
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    const nextUntitled = usedUntitled.length ? Math.max(...usedUntitled) + 1 : 1;
    const name = requestedName || `Untitled ${nextUntitled}`;
    const copy = freshSaveCopy(item);
    const project: SavedProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      itemIds: [copy.id],
    };
    setSavedItems((current) => [copy, ...current]);
    setProjects((current) => [project, ...current]);
    setPendingSave(null);
  };

  const updateProjectNotes = (projectId: string, notes: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, notes } : project
      )
    );
  };

  const updateSavedItemNotes = (itemId: string, notes: string) => {
    setSavedItems((current) =>
      current.map((item) => item.id === itemId ? { ...item, notes } : item)
    );
  };

  const deleteSaved = (item: SavedItem) => {
    setSavedItems((current) => current.filter((saved) => saved.id !== item.id));
    setProjects((current) =>
      current.map((project) => ({
        ...project,
        itemIds: project.itemIds.filter((id) => id !== item.id),
      }))
    );
  };

  const openSaved = (item: SavedItem) => {
    setOpenedSaved(item);

    if (item.kind === 'metal') {
      setSelectedMetal(Number(item.payload.index ?? 0));
      setScreen('metalDetail');
      return;
    }
    if (item.kind === 'thickness') {
      setSelectedThickness(Number(item.payload.index ?? 0));
      setScreen('thicknessDetail');
      return;
    }
    if (item.kind === 'condition') {
      setSelectedCondition(Number(item.payload.index ?? 0));
      setScreen('conditionDetail');
      return;
    }

    setScreen(item.kind);
  };

  const shareSaved = async (item: SavedItem) => {
    try {
      const response = await fetch(SHARE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: item.kind,
          title: item.title,
          subtitle: item.subtitle,
          payload: item.payload,
        }),
      });

      if (!response.ok) throw new Error('share failed');
      const data = await response.json();
      if (!data?.url) throw new Error('missing link');

      await Share.share({
        message: `${item.title}\n${item.subtitle}\n${data.url}`,
        url: data.url,
        title: item.title,
      });
    } catch {
      Alert.alert('Could not share', 'Try again when you have a connection.');
    }
  };

  if (screen === 'circle') {
    return (
      <SafeAreaView style={styles.safe}>
        <CircleScreen
          onBack={backFromOpenedSaved}
          initial={openedSaved?.kind === 'circle' ? openedSaved : null}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'triangle') {
    return (
      <SafeAreaView style={styles.safe}>
        <TriangleScreen
          onBack={backFromOpenedSaved}
          initial={openedSaved?.kind === 'triangle' ? openedSaved : null}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'pipe') {
    return (
      <SafeAreaView style={styles.safe}>
        <PipeScreen
          onBack={backFromOpenedSaved}
          initial={openedSaved?.kind === 'pipe' ? openedSaved : null}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'rod') {
    return (
      <SafeAreaView style={styles.safe}>
        <RodScreen
          onBack={backFromOpenedSaved}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'metal') {
    return (
      <SafeAreaView style={styles.safe}>
        <MetalScreen
          onBack={goHome}
          onSelect={(index) => {
            setSelectedMetal(index);
            setScreen('metalDetail');
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'metalDetail') {
    return (
      <SafeAreaView style={styles.safe}>
        <MetalDetailScreen
          index={selectedMetal}
          onBack={() => openedSaved ? backFromOpenedSaved() : setScreen('metal')}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'thickness') {
    return (
      <SafeAreaView style={styles.safe}>
        <ThicknessScreen
          onBack={goHome}
          onSelect={(index) => {
            setSelectedThickness(index);
            setScreen('thicknessDetail');
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'thicknessDetail') {
    return (
      <SafeAreaView style={styles.safe}>
        <ThicknessDetailScreen
          index={selectedThickness}
          onBack={() => openedSaved ? backFromOpenedSaved() : setScreen('thickness')}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'condition') {
    return (
      <SafeAreaView style={styles.safe}>
        <ConditionScreen
          onBack={goHome}
          onSelect={(index) => {
            setSelectedCondition(index);
            setScreen('conditionDetail');
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'conditionDetail') {
    return (
      <SafeAreaView style={styles.safe}>
        <ConditionDetailScreen
          index={selectedCondition}
          onBack={() => openedSaved ? backFromOpenedSaved() : setScreen('condition')}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
        <SaveToProjectModal
          visible={Boolean(pendingSave)}
          item={pendingSave}
          projects={projects}
          onClose={() => setPendingSave(null)}
          onSaveIndividual={saveIndividual}
          onAddExisting={addToExistingProject}
          onCreateProject={createProjectAndSave}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'saved') {
    return (
      <SafeAreaView style={styles.safe}>
        <SavedScreen
          items={savedItems}
          projects={projects}
          savedNotes={savedNotes}
          onSavedNotesChange={setSavedNotes}
          onBack={goHome}
          onOpen={openSaved}
          onShare={shareSaved}
          onDelete={deleteSaved}
          onNotesChange={updateSavedItemNotes}
          onOpenProject={(project) => {
            setSelectedProjectId(project.id);
            setScreen('project');
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'project') {
    const project = projects.find((entry) => entry.id === selectedProjectId);
    if (!project) {
      setScreen('saved');
      return null;
    }
    return (
      <SafeAreaView style={styles.safe}>
        <ProjectScreen
          project={project}
          items={savedItems}
          onBack={() => setScreen('saved')}
          onOpen={openSaved}
          onShare={shareSaved}
          onDelete={deleteSaved}
          onNotesChange={updateProjectNotes}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.home}>
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.brand}>WELDER’S</Text>
            <Text style={styles.brand}>BLACK BOOK</Text>
          </View>

        </View>

        <Pressable
          onPress={() => setScreen('saved')}
          style={({ pressed }) => [styles.savedHomeTile, pressed && styles.pressed]}
        >
          <View style={styles.savedHomeIcon}>
            <Ionicons name="bookmark" size={32} color={TEXT} />
          </View>
          <View style={styles.savedHomeTextWrap}>
            <Text style={styles.savedHomeTitle}>SAVED</Text>
            <Text style={styles.savedHomeSubtitle}>
              {savedItems.length === 1 ? '1 saved item' : `${savedItems.length} saved items`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={26} color={TEXT} />
        </Pressable>

        <HomeButton
          icon="ellipse-outline"
          iconColor="#efe1bf"
          title="CIRCLE CALCULATOR"
          onPress={() => { setOpenedSaved(null); setScreen('circle'); }}
        />
        <HomeButton
          icon="triangle-outline"
          iconColor="#f2c230"
          title="TRIANGLE CALCULATOR"
          onPress={() => { setOpenedSaved(null); setScreen('triangle'); }}
        />
        <HomeButton
          icon="radio-button-on-outline"
          iconColor="#bfe8f5"
          title="PIPE SIZES"
          subtitle="NB / OD / ID"
          onPress={() => { setOpenedSaved(null); setScreen('pipe'); }}
        />
        <HomeButton
          icon="flash-outline"
          iconColor="#ff8a2b"
          title="WELDING ROD SELECTOR"
          onPress={() => { setOpenedSaved(null); setScreen('rod'); }}
        />
        <HomeButton
          icon="layers-outline"
          iconColor="#e7e1d5"
          title="METAL REFERENCE"
          onPress={() => { setOpenedSaved(null); setScreen('metal'); }}
        />
        <HomeButton
          icon="resize-outline"
          iconColor="#d8b8ff"
          title="THICKNESS REFERENCE"
          onPress={() => { setOpenedSaved(null); setScreen('thickness'); }}
        />
        <HomeButton
          icon="settings-outline"
          iconColor="#f2a31b"
          title="RUST / CONDITION REFERENCE"
          onPress={() => { setOpenedSaved(null); setScreen('condition'); }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  home: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
  },
  brand: {
    color: TEXT,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  settingsButton: {
    paddingTop: 4,
  },
  homeButton: {
    minHeight: 74,
    backgroundColor: PANEL,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e3031',
  },
  pressed: {
    opacity: 0.82,
  },
  homeIconBox: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonTextWrap: {
    flex: 1,
    paddingLeft: 4,
  },
  homeButtonTitle: {
    color: TEXT,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  homeButtonSubtitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  header: {
    height: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 14,
    paddingBottom: 36,
  },
  circleTop: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  circleDrawing: {
    width: 145,
    height: 145,
    borderRadius: 73,
    borderWidth: 3,
    borderColor: TEXT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLine: {
    position: 'absolute',
    width: 145,
    height: 3,
    backgroundColor: TEXT,
  },
  circleD: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
  },
  formulaText: {
    color: TEXT,
    fontSize: 19,
    lineHeight: 31,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    minHeight: 54,
    backgroundColor: PANEL,
    borderRadius: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d2f30',
  },
  segmentButtonActive: {
    backgroundColor: TEXT,
    borderColor: TEXT,
  },
  segmentText: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: BLACK,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: TEXT,
    fontSize: 16,
    marginBottom: 7,
  },
  inputWrap: {
    height: 58,
    backgroundColor: PANEL_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: TEXT,
    fontSize: 26,
    fontWeight: '700',
  },
  resultCard: {
    minHeight: 118,
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e3031',
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  resultTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  resultBig: {
    color: TEXT,
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '900',
  },
  resultUnit: {
    fontSize: 27,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 16,
    height: 48,
    backgroundColor: PANEL_LIGHT,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#505253',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '700',
  },
  triangleTop: {
    height: 180,
    position: 'relative',
    marginBottom: 6,
  },
  triangleOutline: {
    position: 'absolute',
    left: 34,
    top: 15,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 120,
    borderBottomWidth: 120,
    borderRightColor: 'transparent',
    borderBottomColor: TEXT,
    transform: [{ rotate: '0deg' }],
  },
  triangleLabel: {
    position: 'absolute',
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
  },
  triangleFormula: {
    position: 'absolute',
    right: 8,
    top: 64,
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    backgroundColor: PANEL,
  },
  tableRow: {
    minHeight: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#363839',
    alignItems: 'center',
  },
  tableHeader: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#363839',
  },
  tableCell: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#363839',
  },
  tableEditableCell: {
    flex: 1,
  },
  tableRowSelected: {
    backgroundColor: '#2d2b20',
    borderColor: YELLOW,
  },
  pipeReferenceNote: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 18,
  },
  pipeSaveHint: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
  },
  tableInput: {
    flex: 1,
    minHeight: 48,
    color: TEXT,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#363839',
  },
  selectorBlock: {
    marginBottom: 14,
  },
  selectorLabel: {
    color: TEXT,
    fontSize: 16,
    marginBottom: 6,
  },
  selectorField: {
    height: 54,
    backgroundColor: PANEL_LIGHT,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorValue: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  selectorModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectorModalCard: {
    maxHeight: '70%',
    backgroundColor: PANEL,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  selectorModalTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  selectorModalList: {
    flexGrow: 0,
  },
  selectorOption: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: PANEL_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorOptionActive: {
    backgroundColor: YELLOW,
  },
  selectorOptionText: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '700',
  },
  selectorOptionTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  recommendedCard: {
    backgroundColor: YELLOW,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  recommendedLabel: {
    color: BLACK,
    fontSize: 18,
    fontWeight: '900',
  },
  recommendedBig: {
    color: BLACK,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    marginTop: 2,
  },
  recommendedSub: {
    color: BLACK,
    fontSize: 17,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    width: 98,
    color: TEXT,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  referenceRow: {
    minHeight: 70,
    backgroundColor: PANEL,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2e3031',
    marginBottom: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencePhoto: {
    width: 62,
    height: 45,
    borderRadius: 5,
    marginRight: 12,
    backgroundColor: '#333',
  },
  thicknessReferenceImage: {
    width: 61,
    height: 27,
    borderRadius: 2,
    marginRight: 12,
    backgroundColor: '#777',
  },
  referenceTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  referenceSub: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  conditionRow: {
    minHeight: 83,
    backgroundColor: PANEL,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2e3031',
    marginBottom: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionPhoto: {
    width: 83,
    height: 54,
    borderRadius: 5,
    marginRight: 12,
    backgroundColor: '#333',
  },
  detailPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#222',
    marginBottom: 16,
  },
  detailTitle: {
    color: TEXT,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  detailBody: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 16,
  },
  photoSource: {
    color: MUTED,
    fontSize: 11,
    marginTop: 10,
  },
  thicknessDetailCard: {
    minHeight: 190,
    backgroundColor: YELLOW,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 18,
  },
  thicknessDetailLabel: {
    color: BLACK,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  thicknessDetailValue: {
    color: BLACK,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  thicknessDetailMetric: {
    color: BLACK,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  thicknessHeroFrame: {
    width: '100%',
    height: 92,
    borderRadius: 8,
    backgroundColor: '#d9ad34',
    borderWidth: 1,
    borderColor: '#bb8d1e',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  thicknessHeroBar: {
    width: 185,
    minHeight: 4,
    borderRadius: 3,
    backgroundColor: '#303234',
    borderWidth: 1,
    borderColor: '#55585a',
  },
  thicknessScaleNote: {
    color: '#3b3118',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  saveButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#505253',
    backgroundColor: PANEL_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonSaved: {
    backgroundColor: YELLOW,
    borderColor: YELLOW_DARK,
  },
  saveButtonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  saveButtonTextSaved: {
    color: BLACK,
  },
  homeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedHeaderButton: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedHeaderText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },
  savedCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCountText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },
  emptySaved: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptySavedTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 14,
  },
  emptySavedText: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  savedCard: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  savedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  savedCardTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },
  savedCardSub: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
  },
  savedNotepadCard: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 22,
  },
  savedItemNoteLabel: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 6,
  },
  savedItemNotesInput: {
    minHeight: 64,
    backgroundColor: PANEL_DARK,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 14,
    lineHeight: 19,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 10,
  },
  savedDropdown: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  savedDropdownRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  savedDropdownLabel: {
    width: 100,
    color: MUTED,
    fontSize: 12,
    fontWeight: '800',
  },
  savedDropdownValue: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    lineHeight: 18,
  },
  savedDelete: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  savedActionPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: YELLOW,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedActionPrimaryText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '900',
  },
  savedActionSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: PANEL_LIGHT,
    borderWidth: 1,
    borderColor: '#505253',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  savedActionSecondaryText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  savedHomeTile: {
    minHeight: 82,
    backgroundColor: '#3b3d3f',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5a5d5f',
  },
  savedHomeIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#56595b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedHomeTextWrap: {
    flex: 1,
    paddingLeft: 14,
  },
  savedHomeTitle: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  savedHomeSubtitle: {
    color: '#d1d1cd',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  savedIntro: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  savedIntroTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  savedIntroText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  combineSetupBox: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
  },
  setupNameInput: {
    minHeight: 48,
    backgroundColor: PANEL_DARK,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 16,
    paddingHorizontal: 12,
    marginTop: 7,
    marginBottom: 10,
  },
  combineButton: {
    minHeight: 50,
    backgroundColor: YELLOW,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    marginBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  combineButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '900',
  },
  savedCardSelected: {
    borderColor: YELLOW,
    borderWidth: 2,
  },
  savedCheck: {
    width: 26,
    height: 26,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#6a6d6f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  savedCheckSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  savedSetupIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedParts: {
    marginTop: 12,
    gap: 7,
  },
  savedPartRow: {
    backgroundColor: PANEL_DARK,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 9,
    flexDirection: 'row',
    gap: 9,
  },
  savedPartKind: {
    width: 68,
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  savedPartTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  savedPartSub: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  savedSectionTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  savedSectionEmpty: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 10,
  },
  projectCard: {
    minHeight: 70,
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: PANEL_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  projectCount: {
    color: MUTED,
    fontSize: 13,
    marginTop: 3,
  },
  projectDetailHeader: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectDetailName: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '900',
  },
  saveModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  saveModalCard: {
    maxHeight: '82%',
    backgroundColor: PANEL,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    paddingBottom: 28,
  },
  saveModalTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '900',
  },
  saveModalItem: {
    color: MUTED,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  saveModalLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 15,
    marginBottom: 7,
  },
  saveModalPrimary: {
    minHeight: 50,
    backgroundColor: YELLOW,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveModalPrimaryText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '900',
  },
  saveModalProject: {
    minHeight: 50,
    backgroundColor: PANEL_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  saveModalProjectText: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },
  saveModalNewProject: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#55585a',
    paddingHorizontal: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveModalNewProjectText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },
  newProjectBox: {
    marginTop: 4,
  },
  projectNameInput: {
    minHeight: 50,
    backgroundColor: PANEL_DARK,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 17,
    paddingHorizontal: 12,
    marginBottom: 9,
  },
  saveModalCancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveModalCancelText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '900',
  },
  projectNotesCard: {
    backgroundColor: PANEL,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 14,
  },
  projectNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },
  projectNotesTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  projectNotesInput: {
    minHeight: 110,
    backgroundColor: PANEL_DARK,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
});
