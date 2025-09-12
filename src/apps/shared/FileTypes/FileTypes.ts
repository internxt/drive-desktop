/*TODO: DELETE DEAD CODE */
type FileExtensionMap = Record<string, readonly string[]>;

const audioExtensions: FileExtensionMap = {
  '3gp': ['3gp'],
  aa: ['aa'],
  aac: ['aac'],
  aax: ['aax'],
  act: ['act'],
  aiff: ['aiff'],
  alac: ['alac'],
  amr: ['amr'],
  ape: ['ape'],
  au: ['au'],
  awd: ['awd'],
  dss: ['dss'],
  dvf: ['dvf'],
  flac: ['flac'],
  gsm: ['gsm'],
  iklax: ['iklax'],
  ivs: ['ivs'],
  m4a: ['m4a'],
  m4b: ['m4b'],
  m4p: ['m4p'],
  mmf: ['mmf'],
  mp3: ['mp3'],
  mpc: ['mpc'],
  msv: ['msv'],
  nmf: ['nmf'],
  ogg: ['ogg', 'oga', 'mogg'],
  opus: ['opus'],
  ra: ['ra', 'rm'],
  rf64: ['rf64'],
  sln: ['sln'],
  tta: ['tta'],
  voc: ['voc'],
  vox: ['vox'],
  wav: ['wav'],
  wma: ['wma'],
  wv: ['wv'],
  webm: ['webm'],
  '8svx': ['8svx'],
  cda: ['cda'],
};

const codeExtensions: FileExtensionMap = {
  c: ['c', 'h'],
  'c++': ['cpp', 'c++', 'cc', 'cxx', 'hpp', 'h++', 'hh', 'hxx'],
  cobol: ['cob', 'cpy'],
  'c#': ['cs'],
  cmake: ['cmake'],
  coffee: ['coffee'],
  css: ['css'],
  less: ['less'],
  sass: ['sass'],
  scss: ['scss'],
  fortran: ['f', 'for', 'f77', 'f90'],
  'asp.net': ['aspx'],
  html: ['html', 'hmn'],
  java: ['java'],
  jsp: ['jsp'],
  javascript: ['js'],
  typescript: ['ts'],
  json: ['json'],
  jsx: ['jsx'],
  kotlin: ['kt'],
  mathematica: ['m', 'nb'],
  php: ['php', 'php3', 'php4', 'php5', 'phtml'],
  python: ['BUILD', 'bzl', 'py', 'pyw'],
  ruby: ['rb'],
  sql: ['sql'],
  vue: ['vue'],
  yaml: ['yaml', 'yml'],
};

const figmaExtensions: FileExtensionMap = {
  fig: ['fig'],
};

const imageExtensions: FileExtensionMap = {
  tiff: ['tif', 'tiff'],
  bmp: ['bmp'],
  heic: ['heic'],
  jpg: ['jpg', 'jpeg'],
  gif: ['gif'],
  png: ['png'],
  eps: ['eps'],
  raw: ['raw', 'cr2', 'nef', 'orf', 'sr2'],
};
const previewableImageExtensionGroups: string[] = ['jpg', 'png', 'bmp', 'gif'];

const pdfExtensions: FileExtensionMap = {
  pdf: ['pdf'],
};
const previewablePdfExtensionGroups: string[] = ['pdf'];

const pptExtensions: FileExtensionMap = {
  ppt: ['ppt', 'pptx', 'pptm'],
};

const txtExtensions: FileExtensionMap = {
  txt: ['txt', 'text', 'conf', 'def', 'list', 'log', 'md', 'lock'],
};

const videoExtensions: FileExtensionMap = {
  webm: ['webm'],
  mkv: ['mkv'],
  vob: ['vob'],
  ogg: ['ogv', 'ogg'],
  drc: ['drc'],
  avi: ['avi'],
  mts: ['mts', 'm2ts'],
  quicktime: ['mov', 'qt'],
  'windows-media-video': ['wmv'],
  raw: ['yuv'],
  'real-media': ['rm', 'rmvb'],
  'vivo-active': ['viv'],
  asf: ['asf'],
  amv: ['amv'],
  'mpeg-4': ['mp4', 'm4p', 'm4v'],
  'mpeg-1': ['mpg', 'mp2', 'mpeg', 'mpe', 'mpv'],
  'mpeg-2': ['mpg', 'mpeg', 'm2v'],
  m4v: ['m4v'],
  svi: ['svi'],
  '3gpp': ['3gp'],
  '3gpp2': ['3g2'],
  mxf: ['mxf'],
  roq: ['roq'],
  nsv: ['nsv'],
  flv: ['flv', 'f4v', 'f4p', 'f4a', 'f4b'],
};

const WordExtensions: FileExtensionMap = {
  doc: ['doc', 'docx'],
};

const xlsExtensions: FileExtensionMap = {
  xls: ['xls', 'xlsx'],
};

const xmlExtensions: FileExtensionMap = {
  xml: ['xml', 'xsl', 'xsd'],
  svg: ['svg'],
};

const csvExtensions: FileExtensionMap = {
  csv: ['csv'],
};

const zipExtensions: FileExtensionMap = {
  zip: ['zip', 'zipx'],
};

const defaultExtensions: FileExtensionMap = {};

export enum FileExtensionGroup {
  Audio,
  Code,
  Figma,
  Image,
  Pdf,
  Ppt,
  Txt,
  Video,
  Word,
  Xls,
  Xml,
  Csv,
  Zip,
  Default,
}

type FileExtensionsDictionary = Record<FileExtensionGroup, FileExtensionMap>;
type FileExtensionsPreviewableDictionary = {
  [key in FileExtensionGroup]: string[];
};

const fileExtensionGroups: FileExtensionsDictionary = {
  [FileExtensionGroup.Audio]: audioExtensions,
  [FileExtensionGroup.Code]: codeExtensions,
  [FileExtensionGroup.Figma]: figmaExtensions,
  [FileExtensionGroup.Image]: imageExtensions,
  [FileExtensionGroup.Pdf]: pdfExtensions,
  [FileExtensionGroup.Ppt]: pptExtensions,
  [FileExtensionGroup.Txt]: txtExtensions,
  [FileExtensionGroup.Video]: videoExtensions,
  [FileExtensionGroup.Word]: WordExtensions,
  [FileExtensionGroup.Xls]: xlsExtensions,
  [FileExtensionGroup.Xml]: xmlExtensions,
  [FileExtensionGroup.Csv]: csvExtensions,
  [FileExtensionGroup.Zip]: zipExtensions,
  [FileExtensionGroup.Default]: defaultExtensions,
};

export const fileExtensionPreviewableGroups: FileExtensionsPreviewableDictionary =
  {
    [FileExtensionGroup.Audio]: [],
    [FileExtensionGroup.Code]: [],
    [FileExtensionGroup.Figma]: [],
    [FileExtensionGroup.Image]: previewableImageExtensionGroups,
    [FileExtensionGroup.Pdf]: previewablePdfExtensionGroups,
    [FileExtensionGroup.Ppt]: [],
    [FileExtensionGroup.Txt]: [],
    [FileExtensionGroup.Video]: [],
    [FileExtensionGroup.Word]: [],
    [FileExtensionGroup.Xls]: [],
    [FileExtensionGroup.Xml]: [],
    [FileExtensionGroup.Csv]: [],
    [FileExtensionGroup.Zip]: [],
    [FileExtensionGroup.Default]: [],
  };

export default fileExtensionGroups;
