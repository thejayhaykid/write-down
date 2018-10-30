import React, { Component } from "react";
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';

import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';
import {Row, Col, Radio, Switch} from 'antd';

import MarkdownParser from './MarkdownParser';
import Editor from './Editor';

import 'github-markdown-css';
import 'highlight.js/styles/github.css';

import styles from './ArticleEdit.module.css';

import Header from './Header';
import markdownFeatureSrc from '../assets/markdown-test-file';
// import markdownCheatSheet from '../assets/markdown-cheatsheet';

class ArticleEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      src: markdownFeatureSrc,
      displayMode: 'Editor & Preview',
      scrollSync: {
        enabled: true,
        locked: false
      },
      codeMirrorOption: {
        mode: 'gfm',
        theme: 'cherry',
        tabSize: 2,
        styleActiveLine: true,
      }
    };

    this.$editor = null;
    this.$preview = null;

    this.editorScrollDistance = 0;
    this.previewScrollDistance = 0;

    this.lastDisplayMode = 'Editor & Preview';
  }

  componentDidMount() {
    this.$editor = document.querySelector('.editor');
    this.$preview = document.querySelector('.preview');
  }

  handleSourceUpdate = (editor, data, value) => {
    this.setState({
      src: value
    });
  };

  handleScrollSyncToggle = () => {
    this.setState((prev) => ({
      scrollSync: {
        enabled: !prev.scrollSync.enabled,
        locked: !prev.scrollSync.locked
      }
    }))
  };

  handleModeChange = async (e) => {
    const nextDisplayMode = e.target.value;

    this.setState({
      displayMode: nextDisplayMode
    });

    // 仅在'Editor & Preview'使用默认的scroll-sync功能，其他display mode采用this.syncScrollManually()来完成scroll-sync
    if (nextDisplayMode === 'Editor & Preview') {
      // 如果scroll-sync是通过switch设置为关闭后，此时locked为true，切换display mode不能开启它。
      // 只要在switch为开启状态下，即locked为false时，切换回'Editor & Preview'才能开启它。
      if (!this.state.scrollSync.locked) {
        // 在页面还处于伸缩状态时，窗口的高度不定，scroll-sync会导致页面发生跳动
        // 添加一个延时来延迟scroll-sync的开启
        await delay(200);

        this.setState({
          scrollSync: {
            enabled: true
          }
        });
      }
    } else {
      // display mode切换至'Editor Only'或'Preview Only'，则要尽快地关闭scroll-sync，防止无效的同步
      this.setState({
        scrollSync: {
          enabled: false
        }
      });
    }

    this.syncScrollManually(this.lastDisplayMode, nextDisplayMode);

    // 保存前一次的display mode
    this.lastDisplayMode = nextDisplayMode;
  };

  saveScrollTop = () => {
    this.editorScrollDistance = this.$editor.scrollTop;
    this.previewScrollDistance = this.$preview.scrollTop;
  };

  syncScrollManually = async (prevDisplayMode, nextDisplayMode) => {
    // 根据滚动百分比计算对应的滚动距离
    if (prevDisplayMode === 'Editor Only' && nextDisplayMode === 'Preview Only') {
      // 基于editor，计算preview
      const scrollingProportion = this.getScrollingProportion(this.$editor);

      // 防止在切换display mode时，高度突变引起的scrollHeight出错
      await delay(200);
      this.$preview.scrollTop = this.getCalculatedScrollTop(this.$preview, scrollingProportion);
    }

    if (prevDisplayMode === 'Preview Only' && nextDisplayMode === 'Editor Only') {
      // 基于preview，计算editor
      const scrollingProportion = this.getScrollingProportion(this.$preview);

      // 防止在切换display mode时，高度突变引起的scrollHeight出错
      await delay(200);
      this.$editor.scrollTop = this.getCalculatedScrollTop(this.$editor, scrollingProportion);
    }


    // 根据切换至 "Editor & Preview" 之前的显示的内容的滚动距离来设定
    if (prevDisplayMode === 'Editor Only' && nextDisplayMode === 'Editor & Preview') {
      // 这里 +1 是为了稍微更新一下scrollTop，从而触发scroll sync组件的同步功能。
      // 如果不进行 +1，scrollTop与editorScrollDistance是相等的，不会触发scroll sync组件的同步功能
      this.$editor.scrollTop = this.editorScrollDistance - 1;
    }

    if (prevDisplayMode === 'Preview Only' && nextDisplayMode === 'Editor & Preview') {
      this.$preview.scrollTop = this.previewScrollDistance - 1;
    }
  };

  // 计算滚动距离所占的百分比
  getScrollingProportion(node) {
    if (node.matches('.editor')) {
      return (this.editorScrollDistance / (node.scrollHeight - node.clientHeight)).toFixed(4);
    }

    if (node.matches('.preview')) {
      return (this.previewScrollDistance / (node.scrollHeight - node.clientHeight)).toFixed(4);
    }
  }

  // 根据百分比计算出另一个窗口的滚动距离
  getCalculatedScrollTop(node, proportion) {
    return Math.round((node.scrollHeight - node.clientHeight) * proportion);
  }

  toggleStyleOfEditor (currentMode) {
    switch (currentMode) {
      case 'Editor Only':
        return styles.editorOnly;
      case 'Preview Only':
        return styles.editorHide;
      default:
        return styles.editor;
    }
  }

  toggleStyleOfPreviewer (currentMode) {
    switch (currentMode) {
      case 'Editor Only':
        return styles.previewHide;
      case 'Preview Only':
        return styles.previewOnly;
      default:
        return styles.preview;
    }
  }

  render() {
    let renderResult = {
      __html: MarkdownParser.render(this.state.src)
    };

    return (
      <div>
        {/*<Row className={styles.toolBar} type="flex" justify="space-around" align="middle">*/}
          {/*<ToolBar changeMode={this.handleModeChange} toggleScrollSync={this.handleScrollSyncToggle}/>*/}
        {/*</Row>*/}
        <Header toggleScrollSync={this.handleScrollSyncToggle} toggleDisplayMode={this.handleModeChange}/>
        <ScrollSync enabled={this.state.scrollSync.enabled}>
          <Row className={styles.articleEditWrapper} type="flex" justify="center">
            <ScrollSyncPane>
              <Col
                className={this.toggleStyleOfEditor(this.state.displayMode) + ' editor'}
                ref={this.editor}
                onScroll={throttle(this.saveScrollTop, 200, {trailing: true})}
              >
                <Editor
                  value={this.state.src}
                  options={this.state.codeMirrorOption}
                  handleUpdate={this.handleSourceUpdate}
                />
              </Col>
            </ScrollSyncPane>

            <ScrollSyncPane>
              <Col
                className={this.toggleStyleOfPreviewer(this.state.displayMode) + ' preview'}
                onScroll={throttle(this.saveScrollTop, 200, {trailing: true})}
              >
                <Preview renderResult={renderResult}/>
              </Col>
            </ScrollSyncPane>
          </Row>
        </ScrollSync>
      </div>
    );
  }
}

class Preview extends Component {
  render() {
    return (
      <div className='markdown-body' dangerouslySetInnerHTML={this.props.renderResult}/>
    )
  }
}

Preview.propTypes = {
  renderResult: PropTypes.object
};

function ToolBar(props) {
  return (
    <>
      <Col>
        <DisplayMode changeDisplayMode={props.changeMode}/>
      </Col>
      <Col>
        Scroll-Sync&nbsp;
        <ScrollSyncCtrl toggleScrollSync={props.toggleScrollSync}/>
      </Col>
    </>
  )
}

ToolBar.propTypes = {
  changeMode: PropTypes.func,
  toggleScrollSync: PropTypes.func
};

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

function DisplayMode(props) {
  return (
    <div>
      <RadioGroup onChange={props.changeDisplayMode} defaultValue="Editor & Preview" buttonStyle="solid">
        <RadioButton value="Editor Only">Editor</RadioButton>
        <RadioButton value="Editor & Preview">Both</RadioButton>
        <RadioButton value="Preview Only">Preview</RadioButton>
      </RadioGroup>
    </div>
  )
}

DisplayMode.propTypes = {
  changeDisplayMode: PropTypes.func
};

function delay(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function ScrollSyncCtrl(props) {
  return (
    <Switch defaultChecked onChange={props.toggleScrollSync} />
  );
}

ScrollSyncCtrl.propTypes = {
  toggleScrollSync: PropTypes.func
};

export default ArticleEdit;
