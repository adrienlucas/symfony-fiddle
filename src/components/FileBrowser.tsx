import TreeView from "@mui/lab/TreeView";
import * as React from "react";
import {TreeItem} from "@mui/lab";
import {Folder, FolderOpen} from "@mui/icons-material";
import usePhpContext, {FileTree} from "../hooks/usePhpContext";
import {useEffect, useMemo} from "react";



const FileBrowser = ({onClick}: {onClick: (node: FileTree) => void}) => {
  const { initialized, filesystemTree } = usePhpContext()

  // useEffect(() => {
  //   if (!initialized) return
  //   const fileTree = makeFilesystemTree('/src/api-platform', excludedPaths)
  //   fileTree.name = 'symfony'
  //   setFileTree(fileTree)
  // }, [initialized, makeFilesystemTree])

  const renderTree = (node: FileTree) => (
    <TreeItem key={node.id} nodeId={node.id} label={node.name} onClick={() => onClick(node)}>
      {Array.isArray(node.children)
        ? node.children.map((child) => renderTree(child))
        : null}
    </TreeItem>
  );

  useEffect(() => {
    console.log('file tree changed', filesystemTree)
  }, [filesystemTree])
  useEffect(() => {
    console.log('php initialized', initialized)
  }, [initialized])

  const renderedTree = useMemo(() => {
    console.log('rendering tree', filesystemTree)
    if(!filesystemTree) return null
    return renderTree(filesystemTree)
  }, [filesystemTree])

  return (
    <div style={{marginTop: '1rem'}}>
      <TreeView
        aria-label="rich object"
        defaultCollapseIcon={<FolderOpen />}
        defaultExpanded={['root']}
        defaultExpandIcon={<Folder />}
        sx={{ height: '30rem', flexGrow: 1, maxWidth: '100%', overflowY: 'scroll' }}
      >
        {renderedTree}
      </TreeView>
    </div>
  )
}

export default FileBrowser