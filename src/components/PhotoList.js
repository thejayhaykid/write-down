import React, { Component } from "react";
import { Icon, Pagination } from "antd";
import StackGrid from "react-stack-grid";

import styles from './Photo.module.css';
import './Photo.css';

class PhotoList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1
    };
  }

  onNewSearch() {
    this.setState({
      currentPage: 1
    });
  };

  selectPhoto = (photoLink) => {
    this.props.onSelect(photoLink);
  };

  onPageChange = (newPage) => {
    console.log(newPage);
    this.setState({
      currentPage: newPage
    });

    this.props.onPageChange(newPage);
  };

  render() {
    if (this.props.isNewSearch) {
      this.onNewSearch();
    }

    const total = this.props.data.total;
    const results = this.props.data.results;

    let PhotoItems;

    if (results && results.length > 0) {
      PhotoItems = results.map(img =>
        <Photo
          url={img.urls.thumb}
          user={img.user.links.html}
          name={img.user.name}
          link={img.links.html}
          key={img.id}
          onPhotoSelect={this.selectPhoto}
        />
      );

      return (
        <>
          <Pagination
            simple
            current={this.state.currentPage}
            pageSize={this.props.pageSize}
            total={total}
            onChange={this.onPageChange}
          />

          <StackGrid
            className={styles.photoListContainer}
            columnWidth={210}
            monitorImagesLoaded={true}
          >
            {PhotoItems}
          </StackGrid>

          <Pagination
            simple
            current={this.state.currentPage}
            pageSize={this.props.pageSize}
            total={total}
            onChange={this.onPageChange}
          />
        </>
      );
    } else {
      return (
        <div className={styles.noImageFeedback}>No photos match your requirement.</div>
      )
    }
  }
}

class Photo extends Component {
  onClick = () => {
    this.props.onPhotoSelect(this.props.link);
  };

  render() {
    return (
      <div className={styles.photoItemContainer + ' photo-container'}>
        <img
          className={styles.photo + ' photo'}
          src={this.props.url}
          alt="loading..."
          onClick={this.onClick}
        />

        <div className={styles.photoMask + ' photo-mask'}/>

        <span className={styles.photoAuthor + ' photo-author'}>
          @
          <a
            href={this.props.user}
            target="_blank"
            rel="noopener noreferrer"
          >
            {this.props.name}
          </a>
        </span>

        <a className={styles.photoLink + ' photo-link'}
           href={this.props.link}
           target="_blank"
           rel="noopener noreferrer"
        >
          <Icon type="link" theme="outlined"/>
        </a>
      </div>
    );
  }
}

const NoImgs = props => (
  <li className='no-imgs'>
    <i className="material-icons icon-img">sentiment_very_dissatisfied</i>
    <h3>No Images match your search.</h3>
  </li>
);

export default PhotoList;