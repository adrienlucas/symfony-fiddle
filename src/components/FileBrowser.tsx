import TreeView from "@mui/lab/TreeView";
import * as React from "react";
import {TreeItem} from "@mui/lab";
import {Folder, FolderOpen} from "@mui/icons-material";
import usePhpContext, {FileTree} from "../hooks/usePhpContext";
import {useCallback, useMemo} from "react";



const FileBrowser = ({onClick}: {onClick: (node: FileTree) => void}) => {
  const { filesystemTree } = usePhpContext()

  const renderTree = useCallback((node: FileTree) => (
    <TreeItem key={node.id} nodeId={node.id} label={node.name} onClick={() => onClick(node)}>
      {Array.isArray(node.children)
        ? node.children.map((child) => renderTree(child))
        : null}
    </TreeItem>
  ), [onClick])

  const renderedTree = useMemo(() => {
    if(!filesystemTree) return null
    return renderTree(filesystemTree)
  }, [filesystemTree, renderTree])

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