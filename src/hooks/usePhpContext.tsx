import {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState} from "react";
import FS from "fs";
// import Module from '../php-wasm/php-web';
type ccallInterface = (ident: string, returnType: string, argTypes: string[], args: any[], opts?: any[]) => any;

export interface FileTree {
  id: string;
  name: string;
  fullPath: string;
  children?: readonly FileTree[];
}

export interface FileSystem {
  readdir: (path: string) => string[];
  stat: (path: string) => FS.Stats;
  isDir: (mode: number) => boolean;
  readFile: (path: string, options: { encoding: string }) => string;
  writeFile: (path: string, data: string) => void;
  syncfs: (callback: () => void) => void;
}

type PhpState = {
  initialized: boolean;
  stdout: string,
  stderr: string,
  ccall: ccallInterface|null,
  FS: FileSystem|null,
}

const initialPhpState: PhpState = {
  initialized: false,
  stdout: '',
  stderr: '',
  ccall: null,
  FS: null,
}

const initializeModule = 'initializeModule'
const appendStdOut = 'appendStdOut'
const clearStdOut = 'clearStdOut'
const appendStdErr = 'appendStdErr'
const clearStdErr = 'clearStdErr'

type PhpStateMutation =
  // {type: '', payload: {}}
  {type: typeof initializeModule, payload: {ccall: ccallInterface, FS: FileSystem}}
  | {type: typeof appendStdOut| typeof appendStdErr, payload: string}
  | {type: typeof clearStdOut| typeof clearStdErr, payload: null|undefined}

// let isInitialized = false;

const phpStateReducer = (state: PhpState, action: PhpStateMutation) => {
  switch (action.type) {
    case initializeModule:
      if(state.initialized) return state
      console.log('initializing module', action.payload)
      // isInitialized = true
      // action.payload.ccall('pib_init', 'number', ['string'], [])
      return {...state, initialized: true, ccall: action.payload.ccall, FS: action.payload.FS}
    case appendStdOut:
      return {...state, stdout: state.stdout + action.payload}
    case appendStdErr:
      return {...state, stderr: state.stderr + action.payload}
    case clearStdOut:
      return {...state, stdout: ''}
    case clearStdErr:
      return {...state, stderr: ''}
  }
}

const excludedPaths = [
  '/src/api-platform/.idea',
  '/src/api-platform/bin',
  '/src/api-platform/vendor',
  '/src/api-platform/var',
  '/src/api-platform/tests',
  '/src/api-platform/migrations',
  '/src/api-platform/examples',
  '/src/api-platform/persisted-examples',
  '/src/api-platform/translations',
  '/src/api-platform/.gitignore',
  '/src/api-platform/.env',
  '/src/api-platform/.env.test',
  '/src/api-platform/.php-version',
  '/src/api-platform/composer.json',
  '/src/api-platform/composer.lock',
  '/src/api-platform/docker-compose.yml',
  '/src/api-platform/docker-compose.override.yml',
  '/src/api-platform/phpunit.xml.dist',
  '/src/api-platform/symfony.lock',
];
export const buildFsTree = (FileSystem: FileSystem, root: string, parent: string, excludedPaths: string[]): FileTree => {
  const files = FileSystem.readdir(root)
  const children: FileTree[] = [];

  files.forEach((file) => {
    if (file === '.' || file === '..') return

    const path = `${root}/${file}`
    if(excludedPaths.includes(path)) return

    const stat = FileSystem.stat(path)
    if (FileSystem.isDir(stat.mode)) {
      children.push(
        buildFsTree(FileSystem, path, root+'/', excludedPaths)
      )
      return
    }
    const id = `file-${file}`
    children.push({id: id, name: file, fullPath: path})
    // treeRef[id] = path;
  })

  return {
    id: root,
    name: root.replace(parent, ''),
    fullPath: '',
    children: children
  }
}

type PhpContext = {
  initialized: boolean,
  stdout: string,
  filesystemTree: FileTree|null,
  makeFilesystemTree: (rootDir: string, excludedPaths: string[]) => FileTree|null,
  readFile: (path: string) => string|null,
  writeFile: (path: string, content: string) => void,
  initializeModule: (module: any) => void,
  appendStdOut: (text: string) => void,
  appendStdErr: (text: string) => void,
  clearStdOut: () => void,
  clearStdErr: () => void,
  refreshPhp: () => number|null,
  executeCode: (code: string) => string|null,
  runCode: (code: string) => number|null,
}

export const phpContext = createContext<PhpContext>({initialized: false} as PhpContext);

const usePhpContext = () => {
  const context = useContext(phpContext);

  if (context === undefined) {
    throw new Error('usePhpContext must be used within a PhpProvider');
  }

  return context;
}

export const PhpProvider = (props: { children?: ReactNode }) => {
  const [phpState, dispatch] = useReducer(phpStateReducer, initialPhpState)


  const contextValue: PhpContext = {
    appendStdOut: (text: string) => dispatch({type: appendStdOut, payload: text}),
    appendStdErr: (text: string) => dispatch({type: appendStdErr, payload: text}),
    stdout: phpState.stdout,
    initialized: phpState.initialized,
    clearStdOut: () => dispatch({type: clearStdOut, payload: null}),
    clearStdErr: () => dispatch({type: clearStdErr, payload: null}),
    initializeModule: (module: any) => dispatch({type: initializeModule, payload: module}),
    refreshPhp: useCallback((): number | null => {
      if(!phpState.ccall) return null
      return phpState.ccall('pib_refresh', 'number', [], [])
    }, [phpState]),
    filesystemTree: useMemo((): FileTree|null => {
      if(!phpState.FS) return null
      console.log('building filesystem tree', phpState.FS)
      const tree = buildFsTree(phpState.FS, '/src/api-platform', '/src/api-platform', excludedPaths)
      console.log('filesystem tree', tree)
      return tree
    }, [phpState.FS]),
    makeFilesystemTree: useCallback((rootDir: string, excludedPaths: string[]) => {
      if (!phpState.FS) return null
      return buildFsTree(phpState.FS, rootDir, rootDir, excludedPaths)
    }, [phpState.FS]),
    readFile: useCallback((path: string): string|null => {
      if(!phpState.FS) return null
      return phpState.FS.readFile(path, {encoding: 'utf8'})
    }, [phpState.FS]),
    writeFile: useCallback((path: string, content: string): void => {
      if (!phpState.FS) return
      phpState.FS.writeFile(path, content)
      phpState.FS.syncfs(() => {})

      if(!phpState.ccall) return
      phpState.ccall('pib_refresh', 'number', [], [])
    }, [phpState.FS, phpState.ccall]),

    executeCode: useCallback((code: string): string|null => {
      if (!phpState.ccall) return null

      return phpState.ccall('pib_exec', 'string', ['string'], [`(function() {
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        ini_set('log_errors', 1);
        ${code}
      })();`])
    }, [phpState.ccall]),
    runCode: useCallback((code: string): number|null => {
      if (!phpState.ccall) return null

      return phpState.ccall('pib_run', 'num', ['string'], [`
        ?>
        <?php
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        ini_set('log_errors', 1);
        ${code}
        `])
    }, [phpState.FS, phpState.ccall])
  }

  return (<phpContext.Provider value={contextValue} {...props} />)
}


export default usePhpContext