import {useCallback, useEffect, useState} from "react";
import {AppBar, Grid, IconButton, Toolbar, Typography} from "@mui/material";
import {Check as CheckIcon, Downloading as DownloadingIcon, Menu as MenuIcon} from "@mui/icons-material";
import './App.css';
import FileBrowser from "./components/FileBrowser";
import SymfonyConsole from "./components/SymfonyConsole";
import usePhpContext, {FileTree} from './hooks/usePhpContext';
import CodeEditor from "./components/CodeEditor";
import WebBrowser from "./components/WebBrowser";
import {FileEditionContext, FileEditionContextValue} from "./hooks/useFileEditionContext";

import Module from './php-wasm/php-web';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f6f6f6'
    },
    secondary: {
      main: '#81d4fa'
    },
  },
});

function App() {
  const { initializeModule, appendStdOut, appendStdErr, readFile } = usePhpContext()

  const [fileEdition, setFileEdition] = useState<FileEditionContextValue|null>(null)


  useEffect(() => {
    if(!initializeModule) return
    Module({
      onAbort(reason: string) {
        console.error(`WASM aborted: ${reason}`)
      },
      print(data: string) {
        console.log('stdout', data)
        if (data) {
          // dispatch({type: appendStdOut, payload: data})
          appendStdOut(data)
        }
      },
      printErr(data: string) {
        console.log('stderr', data)
        if (data) {
          // dispatch({type: appendStdErr, payload: data})
          appendStdErr(data)
        }
      },
    }).then((phpModule: any) => {
      console.log('phpModule then from App', phpModule)
      phpModule.ccall('pib_init', 'number', ['string'], [])
      initializeModule(phpModule)
    })
  }, [initializeModule, appendStdOut, appendStdErr])

  const selectFile = useCallback((fullPath: string, name: string) => {
    if(fullPath === '') return

    setFileEdition({
      content: readFile(fullPath) ?? '',
      type: name.split('.').pop() || 'txt',
      fullPath: fullPath
    })
  }, [readFile])

  const [pendingModifications, setPendingModifications] = useState<boolean>(false)

  return (
    <ThemeProvider theme={theme}>
      <Grid container>
        <FileEditionContext.Provider value={fileEdition}>
          <Grid item container xs={7}>
            <Grid item xs={12}>
              <AppBar position="static" color={"primary"}>
                <Toolbar variant={"dense"}>
                  <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography component="div" sx={{ flexGrow: 1 }}>
                    {fileEdition?.fullPath}
                  </Typography>
                  { fileEdition?.fullPath ? (!pendingModifications ? <CheckIcon /> : <DownloadingIcon />) : null }
                </Toolbar>
              </AppBar>
            </Grid>
            <Grid item xs={3} height={'100%'}>
              <FileBrowser
                onClick={(node: FileTree) => {selectFile(node.fullPath, node.name)}}
              />
            </Grid>
            <Grid item xs={9}>
              <CodeEditor onPendingModifications={(pendingModifications) => setPendingModifications(pendingModifications)}/>
            </Grid>
          </Grid>
        </FileEditionContext.Provider>
        <Grid item container xs={5}>
          <Grid item xs={12} height={'50vh'}>
              <WebBrowser />
          </Grid>
          <Grid item xs={12} height={'50vh'}>
              <SymfonyConsole />
          </Grid>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App
