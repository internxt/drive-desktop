import Audio from './audio.svg';
import Code from './code.svg';
import Csv from './csv.svg';
import Default from './default.svg';
import Excel from './excel.svg';
import Figma from './figma.svg';
import Folder from './folder.svg';
import Illustrator from './illustrator.svg';
import Image from './image.svg';
import Indesign from './indesign.svg';
import Pdf from './pdf.svg';
import Photoshop from './photoshop.svg';
import Powerpoint from './powerpoint.svg';
import Ppt from './ppt.svg';
import Sketch from './sketch.svg';
import Txt from './txt.svg';
import Video from './video.svg';
import Word from './word.svg';
import Zip from './zip.svg';

interface iconLibrary {
  id: string;
  icon: any;
  extensions: string[];
}

// const getSVG = (svg: any) => svg as React.SVGAttributes<SVGElement>;

const file_type: iconLibrary[] = [
  {
    id: 'audio',
    icon: <Audio />,
    extensions: [
      '3gp',
      'aa',
      'aac',
      'aax',
      'act',
      'aiff',
      'alac',
      'amr',
      'ape',
      'au',
      'awd',
      'dss',
      'dvf',
      'flac',
      'gsm',
      'iklax',
      'ivs',
      'm4a',
      'm4b',
      'm4p',
      'mmf',
      'mp3',
      'mpc',
      'msv',
      'nmf',
      'ogg',
      'oga',
      'mogg',
      'opus',
      'ra',
      'rm',
      'rf64',
      'sln',
      'tta',
      'voc',
      'vox',
      'wav',
      'wma',
      'wv',
      'webm',
      '8svx',
      'cda',
    ],
  },
  {
    id: 'code',
    icon: <Code />,
    extensions: [
      'c',
      'h',
      'cpp',
      'c++',
      'cc',
      'cxx',
      'hpp',
      'h++',
      'hh',
      'hxx',
      'cob',
      'cpy',
      'cs',
      'cmake',
      'coffee',
      'css',
      'less',
      'sass',
      'scss',
      'f',
      'for',
      'f77',
      'f90',
      'aspx',
      'html',
      'hmn',
      'java',
      'jsp',
      'js',
      'ts',
      'json',
      'jsx',
      'kt',
      'm',
      'nb',
      'php',
      'php3',
      'php4',
      'php5',
      'phtml',
      'build',
      'bzl',
      'py',
      'pyw',
      'rb',
      'sql',
      'vue',
      'yaml',
      'yml',
    ],
  },
  {
    id: 'csv',
    icon: <Csv />,
    extensions: ['csv'],
  },
  {
    id: 'excel',
    icon: <Excel />,
    extensions: ['xlsx', 'xlsm', 'xlsb', 'xltx', 'xltm', 'xls', 'xlt', 'xlam', 'xla', 'xlw', 'xlr'],
  },
  {
    id: 'figma',
    icon: <Figma />,
    extensions: ['fig'],
  },
  {
    id: 'folder',
    icon: <Folder />,
    extensions: ['folder'],
  },
  {
    id: 'illustrator',
    icon: <Illustrator />,
    extensions: ['ai'],
  },
  {
    id: 'image',
    icon: <Image />,
    extensions: [
      'tif',
      'tiff',
      'bmp',
      'heic',
      'jpg',
      'jpeg',
      'gif',
      'png',
      'eps',
      'raw',
      'cr2',
      'nef',
      'orf',
      'sr2',
      'webp',
    ],
  },
  {
    id: 'indesign',
    icon: <Indesign />,
    extensions: ['indd', 'indl', 'indb', 'indt', 'inx', 'idml'],
  },
  {
    id: 'pdf',
    icon: <Pdf />,
    extensions: ['pdf'],
  },
  {
    id: 'photoshop',
    icon: <Photoshop />,
    extensions: ['psd'],
  },
  {
    id: 'powerpoint',
    icon: <Powerpoint />,
    extensions: ['pptx', 'pptm'],
  },
  {
    id: 'ppt',
    icon: <Ppt />,
    extensions: ['ppt'],
  },
  {
    id: 'sketch',
    icon: <Sketch />,
    extensions: ['sketch'],
  },
  {
    id: 'txt',
    icon: <Txt />,
    extensions: ['txt', 'text', 'conf', 'def', 'list', 'log', 'md', 'lock'],
  },
  {
    id: 'video',
    icon: <Video />,
    extensions: [
      'webm',
      'mkv',
      'vob',
      'ogg',
      'drc',
      'avi',
      'mts',
      'm2ts',
      'mov',
      'qt',
      'wmv',
      'yuv',
      'rm',
      'rmvb',
      'viv',
      'asf',
      'amv',
      'mp4',
      'm4p',
      'mpg',
      'mp2',
      'mpeg',
      'mpe',
      'mpv',
      'm2v',
      'm4v',
      'svi',
      '3gp',
      '3g2',
      'mxf',
      'roq',
      'msv',
      'flv',
      'f4v',
      'f4p',
      'f4a',
      'f4b',
    ],
  },
  {
    id: 'word',
    icon: <Word />,
    extensions: ['doc', 'docx'],
  },
  {
    id: 'zip',
    icon: <Zip />,
    extensions: ['zip', 'zipx', 'rar', '7z', 'deb', 'pkg', 'tar.gz', 'z', 'arj', 'rpm'],
  },
];

export const fileIcon = (extension: string) => {
  const file_icon = file_type.filter((type) => type.extensions.includes(extension.toLowerCase()));

  if (file_icon.length > 0) {
    return file_icon[0].icon;
  } else {
    return <Default />;
  }
};
