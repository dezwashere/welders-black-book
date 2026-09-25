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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  | 'conditionDetail';

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

const metals = [
  {
    name: 'Mild Steel',
    image: wikiImage('Metal steel surface.jpg'),
    description: 'Low-carbon steel with a dull gray surface. One of the most common fabrication and structural welding materials.',
    welding: 'Commonly welded with SMAW, MIG, TIG, and flux-core processes.',
    note: 'Remove mill scale, oil, paint, and heavy rust where practical before welding.',
  },
  {
    name: 'Stainless Steel',
    image: wikiImage('Stainless-steel-304-austenite-fracture.jpeg'),
    description: 'Corrosion-resistant steel containing chromium. Surface appearance can range from bright to brushed or matte.',
    welding: 'Use a filler compatible with the stainless grade and control heat input.',
    note: 'Keep stainless tools and abrasives separate from carbon-steel tools to reduce contamination.',
  },
  {
    name: 'Aluminum',
    image: wikiImage('Aluminum sheet info.jpg'),
    description: 'Lightweight nonferrous metal with a silver-gray oxide layer that reforms quickly after cleaning.',
    welding: 'Typically welded with MIG or AC TIG using aluminum-compatible filler.',
    note: 'Remove oxide and contamination immediately before welding for best results.',
  },
  {
    name: 'Cast Iron',
    image: wikiImage('Castingiron.jpg'),
    description: 'High-carbon iron alloy commonly found in cast housings, machinery, cookware, and older components.',
    welding: 'Repair welding often uses nickel-based filler and controlled preheat/cooling procedures.',
    note: 'Identify the casting and repair requirements before welding; cracking risk can be significant.',
  },
  {
    name: 'Galvanized',
    image: wikiImage('Galvanized surface.jpg'),
    description: 'Steel coated with zinc. Hot-dip galvanized surfaces often show a crystalline spangle pattern.',
    welding: 'The zinc coating should be removed from the weld area where practical.',
    note: 'Use effective ventilation/fume controls when welding galvanized material.',
  },
  {
    name: 'Chromoly',
    image: wikiImage('Rivendell Roadeo Fork 01.jpg'),
    description: 'Chromium-molybdenum alloy steel used for high-strength tubing, frames, motorsport parts, and fabrication.',
    welding: 'Filler and heat treatment depend on the exact alloy, thickness, and service requirement.',
    note: 'Do not assume every Cr-Mo alloy can use the same procedure; verify the material grade.',
  },
  {
    name: 'Copper',
    image: wikiImage('Copper sheet 50x.jpg'),
    description: 'Highly conductive nonferrous metal with a reddish-orange appearance when clean.',
    welding: 'High thermal conductivity usually requires more heat input than similarly sized steel.',
    note: 'Use a process and filler intended for the specific copper alloy.',
  },
] as const;

const thicknesses = [
  { label: '24 gauge', value: '0.024 in (0.6 mm)', inches: '0.024 in', mm: '0.6 mm', note: 'Very thin sheet. Heat control is critical to reduce burn-through and distortion.' },
  { label: '20 gauge', value: '0.036 in (0.9 mm)', inches: '0.036 in', mm: '0.9 mm', note: 'Thin sheet. Short welds, lower heat, and good fit-up help control distortion.' },
  { label: '18 gauge', value: '0.048 in (1.2 mm)', inches: '0.048 in', mm: '1.2 mm', note: 'Common light-gauge sheet thickness used in fabrication and repair work.' },
  { label: '16 gauge', value: '0.060 in (1.5 mm)', inches: '0.060 in', mm: '1.5 mm', note: 'Light sheet with a little more heat tolerance than 18- or 20-gauge material.' },
  { label: '14 gauge', value: '0.075 in (1.9 mm)', inches: '0.075 in', mm: '1.9 mm', note: 'Medium sheet thickness used in brackets, panels, and general fabrication.' },
  { label: '11 gauge', value: '0.120 in (3.0 mm)', inches: '0.120 in', mm: '3.0 mm', note: 'Near 1/8 inch plate thickness and suitable for many general fabrication jobs.' },
  { label: '1/8"', value: '0.125 in (3.2 mm)', inches: '0.125 in', mm: '3.2 mm', note: 'Common light plate thickness. Joint type still determines required penetration and settings.' },
  { label: '1/4"', value: '0.250 in (6.4 mm)', inches: '0.250 in', mm: '6.4 mm', note: 'Common plate thickness. Beveling or multiple passes may be required depending on the joint and process.' },
  { label: '3/8"', value: '0.375 in (9.5 mm)', inches: '0.375 in', mm: '9.5 mm', note: 'Heavier plate that often requires joint preparation and multiple passes.' },
  { label: '1/2"', value: '0.500 in (12.7 mm)', inches: '0.500 in', mm: '12.7 mm', note: 'Heavy plate. Procedure, preheat, joint design, and multiple passes become increasingly important.' },
] as const;

const conditions = [
  {
    name: 'Clean',
    desc: 'Bare metal, no rust or coating.',
    image: wikiImage('Metal steel surface.jpg'),
    prep: 'Remove oil, moisture, dirt, and loose scale. Bright clean metal gives the most predictable arc and weld quality.',
  },
  {
    name: 'Light Rust',
    desc: 'Surface rust, still solid.',
    image: wikiImage('Rust on metal.jpg'),
    prep: 'Wire-brush or grind the weld zone to remove loose oxidation. Confirm the base metal is still sound.',
  },
  {
    name: 'Moderate Rust',
    desc: 'Visible rust and scale.',
    image: wikiImage('Rusty steel plate.jpg'),
    prep: 'Mechanically remove rust and scale around the joint. Recheck remaining thickness before welding.',
  },
  {
    name: 'Heavy Rust',
    desc: 'Thick rust, pitting, or material loss.',
    image: wikiImage('Rusted metal.jpg'),
    prep: 'Do not weld over heavy corrosion. Clean to sound metal and verify that enough base material remains for a safe repair.',
  },
  {
    name: 'Painted',
    desc: 'Paint or coating over the base metal.',
    image: wikiImage('Rusted top edge white painted slightly worn scratched chipped steel metal surface texture.jpg'),
    prep: 'Remove paint from the weld zone and nearby heat-affected area. Unknown coatings can create hazardous fumes.',
  },
  {
    name: 'Galvanized',
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
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}>
      <View style={styles.homeIconBox}>
        <Ionicons name={icon} size={31} color={BLACK} />
      </View>
      <View style={styles.homeButtonTextWrap}>
        <Text style={styles.homeButtonTitle}>{title}</Text>
        {subtitle ? <Text style={styles.homeButtonSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={26} color={BLACK} />
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

function CircleScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState(0);
  const [value, setValue] = useState('4');
  const result = useMemo(() => {
    const n = parseFloat(value);
    if (!isFinite(n)) return '';
    return mode === 0 ? (Math.PI * n).toFixed(2) : (n / Math.PI).toFixed(2);
  }, [mode, value]);

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

        <Pressable onPress={() => setValue('')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function TriangleScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState(0);
  const [a, setA] = useState('3');
  const [b, setB] = useState('4');

  const c = useMemo(() => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    return isFinite(x) && isFinite(y) ? Math.sqrt(x * x + y * y).toFixed(2) : '';
  }, [a, b]);

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

function PipeScreen({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState(fallbackPipes);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    supabase
      .from('pipe_sizes')
      .select('nominal_size,od_in,sch40_id_in')
      .order('id')
      .then(({ data }) => {
        if (data?.length) {
          setRows(
            data.map((r) => [
              r.nominal_size,
              String(r.od_in),
              String(r.sch40_id_in),
            ])
          );
        }
      });
  }, []);

  return (
    <>
      <Header title="PIPE SIZES" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Segment
          labels={['NB Sizes', 'OD / ID', 'Slip Fit']}
          active={tab}
          onChange={setTab}
        />

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={styles.tableHeader}>NB{'\\n'}(in)</Text>
            <Text style={styles.tableHeader}>OD{'\\n'}(in)</Text>
            <Text style={styles.tableHeader}>Schedule 40{'\\n'}ID (in)</Text>
          </View>
          {rows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{row[0]}</Text>
              <Text style={styles.tableCell}>{row[1]}</Text>
              <Text style={styles.tableCell}>{row[2]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function SelectorRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.selectorBlock}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable style={styles.selectorField}>
        <Text style={styles.selectorValue}>{value}</Text>
        <Ionicons name="chevron-down" size={20} color={TEXT} />
      </Pressable>
    </View>
  );
}

function RodScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Header title="WELDING ROD SELECTOR" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <SelectorRow label="Metal" value="Mild Steel" />
        <SelectorRow label="Thickness" value='1/4" (6 mm)' />
        <SelectorRow label="Condition" value="Clean" />

        <View style={styles.recommendedCard}>
          <Text style={styles.recommendedLabel}>Recommended Rod</Text>
          <Text style={styles.recommendedBig}>3.2 mm</Text>
          <Text style={styles.recommendedSub}>(1/8")</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoLine label="Common Types" value="E6011, E7018" />
          <InfoLine label="Polarity" value="AC or DCEP" />
          <InfoLine label="Amperage" value="90 – 130 A" />
          <InfoLine
            label="Notes"
            value="Good all-purpose for mild steel. E6011 for dirty/rusty, E7018 for clean."
            multiline
          />
        </View>
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
            <Image source={{ uri: metal.image }} style={styles.referencePhoto} />
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
            <View style={styles.thicknessSwatch} />
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
            <Image source={{ uri: condition.image }} style={styles.conditionPhoto} />
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

function MetalDetailScreen({ index, onBack }: { index: number; onBack: () => void }) {
  const metal = metals[index];
  return (
    <>
      <Header title={metal.name.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: metal.image }} style={styles.detailPhoto} />
        <Text style={styles.detailTitle}>{metal.name}</Text>
        <Text style={styles.detailBody}>{metal.description}</Text>
        <View style={styles.infoCard}>
          <InfoLine label="Welding" value={metal.welding} multiline />
          <InfoLine label="Prep / Notes" value={metal.note} multiline />
        </View>
        <Text style={styles.photoSource}>Reference photo: Wikimedia Commons</Text>
      </ScrollView>
    </>
  );
}

function ThicknessDetailScreen({ index, onBack }: { index: number; onBack: () => void }) {
  const item = thicknesses[index];
  return (
    <>
      <Header title={item.label.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.thicknessDetailCard}>
          <Text style={styles.thicknessDetailLabel}>{item.label}</Text>
          <Text style={styles.thicknessDetailValue}>{item.inches}</Text>
          <Text style={styles.thicknessDetailMetric}>{item.mm}</Text>
        </View>
        <View style={styles.infoCard}>
          <InfoLine label="Nominal" value={item.label} />
          <InfoLine label="Decimal" value={item.inches} />
          <InfoLine label="Metric" value={item.mm} />
          <InfoLine label="Welding note" value={item.note} multiline />
        </View>
      </ScrollView>
    </>
  );
}

function ConditionDetailScreen({ index, onBack }: { index: number; onBack: () => void }) {
  const condition = conditions[index];
  return (
    <>
      <Header title={condition.name.toUpperCase()} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: condition.image }} style={styles.detailPhoto} />
        <Text style={styles.detailTitle}>{condition.name}</Text>
        <Text style={styles.detailBody}>{condition.desc}</Text>
        <View style={styles.infoCard}>
          <InfoLine label="Prep / Notes" value={condition.prep} multiline />
        </View>
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
  const goHome = () => setScreen('home');

  if (screen === 'circle') {
    return (
      <SafeAreaView style={styles.safe}>
        <CircleScreen onBack={goHome} />
      </SafeAreaView>
    );
  }

  if (screen === 'triangle') {
    return (
      <SafeAreaView style={styles.safe}>
        <TriangleScreen onBack={goHome} />
      </SafeAreaView>
    );
  }

  if (screen === 'pipe') {
    return (
      <SafeAreaView style={styles.safe}>
        <PipeScreen onBack={goHome} />
      </SafeAreaView>
    );
  }

  if (screen === 'rod') {
    return (
      <SafeAreaView style={styles.safe}>
        <RodScreen onBack={goHome} />
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
        <MetalDetailScreen index={selectedMetal} onBack={() => setScreen('metal')} />
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
          onBack={() => setScreen('thickness')}
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
          onBack={() => setScreen('condition')}
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
          <Pressable hitSlop={12} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={28} color={TEXT} />
          </Pressable>
        </View>

        <HomeButton
          icon="ellipse-outline"
          title="CIRCLE CALCULATOR"
          onPress={() => setScreen('circle')}
        />
        <HomeButton
          icon="triangle-outline"
          title="TRIANGLE CALCULATOR"
          onPress={() => setScreen('triangle')}
        />
        <HomeButton
          icon="radio-button-on-outline"
          title="PIPE SIZES"
          subtitle="NB / OD / ID"
          onPress={() => setScreen('pipe')}
        />
        <HomeButton
          icon="flash-outline"
          title="WELDING ROD SELECTOR"
          onPress={() => setScreen('rod')}
        />
        <HomeButton
          icon="layers-outline"
          title="METAL REFERENCE"
          onPress={() => setScreen('metal')}
        />
        <HomeButton
          icon="resize-outline"
          title="THICKNESS REFERENCE"
          onPress={() => setScreen('thickness')}
        />
        <HomeButton
          icon="settings-outline"
          title="RUST / CONDITION REFERENCE"
          onPress={() => setScreen('condition')}
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
    backgroundColor: YELLOW,
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: YELLOW_DARK,
  },
  pressed: {
    opacity: 0.82,
  },
  homeIconBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonTextWrap: {
    flex: 1,
    paddingLeft: 4,
  },
  homeButtonTitle: {
    color: BLACK,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  homeButtonSubtitle: {
    color: '#2f2a1b',
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
    height: 50,
    borderRadius: 5,
    marginRight: 12,
    backgroundColor: '#333',
  },
  thicknessSwatch: {
    width: 62,
    height: 34,
    borderRadius: 2,
    backgroundColor: '#8a8b87',
    borderWidth: 1,
    borderColor: '#b4b4af',
    marginRight: 12,
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
    width: 78,
    height: 66,
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
});
